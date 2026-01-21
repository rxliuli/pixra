import {
  removeBackground,
  subscribeToProgress,
  getCapabilities,
} from 'rembg-webgpu'
import { env } from '@huggingface/transformers'
import { imageBitmapToArrayBuffer } from './imageBitmap'

export interface RemoveBgOptions {
  onProgress?: (message: string, percentage: number) => void
}

function configureTransformersEnv() {
  const remoteHost = (import.meta.env.VITE_HF_REMOTE_HOST as string | undefined)
  const remotePathTemplate = (
    import.meta.env.VITE_HF_REMOTE_PATH_TEMPLATE as string | undefined
  )
  const ortWasmPaths = (import.meta.env.VITE_ORT_WASM_PATHS as
    | string
    | undefined)

  if (remoteHost) {
    env.remoteHost = remoteHost.endsWith('/') ? remoteHost : `${remoteHost}/`
  }
  if (remotePathTemplate) {
    env.remotePathTemplate = remotePathTemplate
  }
  if (ortWasmPaths && env.backends?.onnx?.wasm) {
    env.backends.onnx.wasm.wasmPaths = ortWasmPaths
  }
}

export async function removeBg(
  imageData: ImageBitmap,
  options?: RemoveBgOptions,
): Promise<ImageBitmap> {
  configureTransformersEnv()

  // 将 ImageBitmap 转换为 ArrayBuffer
  const arrayBuffer = await imageBitmapToArrayBuffer(imageData)

  // Optional: Check device capabilities before initialization
  const capability = await getCapabilities()
  console.log(`Backend: ${capability.device}, Precision: ${capability.dtype}`)
  // Possible results:
  // - { device: 'webgpu', dtype: 'fp16' } - Best performance
  // - { device: 'webgpu', dtype: 'fp32' } - Good performance
  // - { device: 'wasm', dtype: 'fp32' }   - Universal fallback

  // Optional: Subscribe to ONNX download/build progress to show a loader
  const unsubscribe = subscribeToProgress((state) => {
    let message = 'Processing...'
    let percentage = state.progress

    if (state.phase === 'downloading') {
      message = 'Downloading AI model...'
    } else if (state.phase === 'building') {
      message = 'Loading model...'
      percentage = 50 + state.progress / 2
    } else if (state.phase === 'ready') {
      message = 'Processing image...'
      percentage = 90
    } else if (state.phase === 'error') {
      message = state.errorMsg || 'Error occurred'
      percentage = 0
    }

    options?.onProgress?.(message, percentage)
  })

  let blobUrl: string | undefined
  try {
    // Remove background from an image
    const blob = new Blob([arrayBuffer], { type: 'image/png' })
    blobUrl = URL.createObjectURL(blob)
    const result = await removeBackground(blobUrl)

    const response = await fetch(result.blobUrl)
    const resultBlob = await response.blob()
    return await createImageBitmap(resultBlob)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    if (/Failed to fetch|NetworkError|fetch/i.test(msg)) {
      throw new Error(
        `Remove background failed: model/assets download blocked or unreachable. ` +
          `Consider setting VITE_HF_REMOTE_HOST (HF mirror) and/or VITE_ORT_WASM_PATHS (local onnxruntime wasm). Original error: ${msg}`,
      )
    }
    throw error
  } finally {
    unsubscribe()
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl)
    }
  }
}

/**
 * Remove Background Plugin for Pixra
 *
 * Uses @imgly/background-removal to remove background from images
 * using AI (ONNX model running in WebAssembly/WebGPU).
 */

import * as pixra from '@pixra/plugin-sdk'
import {
  getCapabilities,
  removeBackground,
  subscribeToProgress,
} from 'rembg-webgpu'

/**
 * Convert ImageData to Blob
 */
function imageDataToBlob(imageData: ImageData): Promise<Blob> {
  const canvas = new OffscreenCanvas(imageData.width, imageData.height)
  const ctx = canvas.getContext('2d')!
  ctx.putImageData(imageData, 0, 0)
  return canvas.convertToBlob({ type: 'image/png' })
}

/**
 * Convert Blob to ImageData
 */
async function blobToImageData(blob: Blob): Promise<ImageData> {
  const bitmap = await createImageBitmap(blob)
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()
  return ctx.getImageData(0, 0, canvas.width, canvas.height)
}

/**
 * Remove background from the current image
 */
async function removeBg(): Promise<void> {
  const imageData = await pixra.workspace.getActiveImage()
  if (!imageData) {
    await pixra.window.showErrorMessage('No image is currently open')
    return
  }

  await pixra.window.withProgress(
    { title: 'Removing Background', cancellable: false },
    async (progress) => {
      // 将 ImageData 转换为 ArrayBuffer
      const blob = await imageDataToBlob(imageData)

      // Optional: Check device capabilities before initialization
      const capability = await getCapabilities()
      console.log(
        `Backend: ${capability.device}, Precision: ${capability.dtype}`,
      )
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

        progress.report({ message, percentage })
      })

      let blobUrl: string | undefined
      try {
        // Remove background from an image
        blobUrl = URL.createObjectURL(blob)
        const result = await removeBackground(blobUrl)

        const response = await fetch(result.blobUrl)
        const resultBlob = await response.blob()
        await pixra.workspace.updateActiveImage(
          await blobToImageData(resultBlob),
        )
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
    },
  )
}

/**
 * Plugin activation
 */
export function activate(context: pixra.ExtensionContext) {
  const disposable = pixra.commands.registerCommand('removeBg.remove', removeBg)
  context.subscriptions.push(disposable)
}

/**
 * Plugin deactivation
 */
export function deactivate() {
  // Nothing to clean up
}

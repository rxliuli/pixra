/**
 * Remove Object Plugin for Pixra
 *
 * Uses MI-GAN model for image inpainting to remove objects from images.
 * The model runs entirely in the browser using ONNX Runtime with WASM.
 *
 * Model: MI-GAN Pipeline v2 (~28MB) - much smaller than LaMa (~200MB)
 * Paper: "MI-GAN: A Simple Baseline for Image Inpainting on Mobile Devices" (ICCV 2023)
 */

import * as pixra from '@pixra/plugin-sdk'
import * as ort from 'onnxruntime-web'

// Model configuration
// Using MI-GAN pipeline v2 (~28MB) - includes preprocessing and postprocessing
const MODEL_URL =
  'https://huggingface.co/andraniksargsyan/migan/resolve/main/migan_pipeline_v2.onnx'

// Get the version of onnxruntime-web for CDN paths
// IMPORTANT: This must match the installed version of onnxruntime-web in package.json
const ORT_CDN_BASE = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ort.env.versions.common}/dist/`

// Singleton session for model reuse
let session: ort.InferenceSession | null = null
let isLoading = false
let ortInitialized = false

/**
 * Initialize ONNX Runtime environment
 */
function initOrt() {
  if (ortInitialized) return

  // Set WASM paths to CDN for web worker compatibility
  ort.env.wasm.wasmPaths = ORT_CDN_BASE

  ortInitialized = true
}

/**
 * Load the ONNX model using WASM backend
 * Fetches model with cache support for better performance on subsequent loads
 */
async function loadModel(
  progress: pixra.Progress,
): Promise<ort.InferenceSession> {
  if (session) {
    return session
  }

  if (isLoading) {
    // Wait for the model to load
    while (isLoading) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    return session!
  }

  isLoading = true

  try {
    // Initialize ORT environment
    initOrt()

    progress.report({ message: 'Downloading AI model...', percentage: 0 })

    // Fetch model with cache support
    const response = await fetch(MODEL_URL, { cache: 'force-cache' })
    if (!response.ok) {
      throw new Error(`Failed to download model: ${response.status}`)
    }

    progress.report({ message: 'Loading model into memory...', percentage: 30 })

    const modelBuffer = await response.arrayBuffer()

    progress.report({ message: 'Initializing model...', percentage: 40 })

    // Use WASM backend only - WebGPU has compatibility issues with some operations
    session = await ort.InferenceSession.create(modelBuffer, {
      executionProviders: ['webgpu', 'wasm'],
    })

    // Log model input/output names for debugging
    // console.log('Model inputs:', session.inputNames)
    // console.log('Model outputs:', session.outputNames)

    progress.report({ message: 'Model loaded', percentage: 50 })
    return session
  } finally {
    isLoading = false
  }
}

/**
 * Prepare inputs for MI-GAN pipeline model
 *
 * MI-GAN pipeline expects:
 * - image: uint8 RGB tensor [H, W, 3]
 * - mask: uint8 grayscale tensor [H, W, 1] where 255=keep, 0=inpaint
 * - resolution: int64 scalar (512 for this model)
 */
function prepareInputs(
  imageData: ImageData,
  selection: pixra.SelectionRect,
): { image: ort.Tensor; mask: ort.Tensor } {
  const { width, height } = imageData

  // Create image tensor in NCHW format [batch, channels, height, width]
  const imageArray = new Uint8Array(3 * height * width)
  for (let c = 0; c < 3; c++) {
    for (let h = 0; h < height; h++) {
      for (let w = 0; w < width; w++) {
        const srcIdx = (h * width + w) * 4 + c
        const dstIdx = c * height * width + h * width + w
        imageArray[dstIdx] = imageData.data[srcIdx]
      }
    }
  }

  // Create mask tensor in NCHW format [batch, 1, height, width]
  // MI-GAN: 255 = known/keep region, 0 = masked/inpaint region
  const maskArray = new Uint8Array(height * width)
  maskArray.fill(255) // Default: keep everything

  // Mark selection area as masked (0 = inpaint)
  const selX = Math.max(0, Math.floor(selection.x))
  const selY = Math.max(0, Math.floor(selection.y))
  const selW = Math.min(width - selX, Math.ceil(selection.width))
  const selH = Math.min(height - selY, Math.ceil(selection.height))

  for (let y = selY; y < selY + selH; y++) {
    for (let x = selX; x < selX + selW; x++) {
      maskArray[y * width + x] = 0
    }
  }

  // Model expects NCHW format [batch, channels, height, width]
  const image = new ort.Tensor('uint8', imageArray, [1, 3, height, width])
  const mask = new ort.Tensor('uint8', maskArray, [1, 1, height, width])

  return { image, mask }
}

/**
 * Convert model output to ImageData
 * MI-GAN pipeline outputs uint8 RGB tensor in NCHW format [1, 3, H, W]
 */
function outputToImageData(
  output: ort.Tensor,
  originalWidth: number,
  originalHeight: number,
): ImageData {
  const outputData = output.data as Uint8Array
  const dims = output.dims as number[]

  // Output is NCHW: [batch, channels, height, width]
  const outH = dims[2]
  const outW = dims[3]

  // Create canvas for potential resizing
  const resultCanvas = new OffscreenCanvas(outW, outH)
  const resultCtx = resultCanvas.getContext('2d')!
  const resultImageData = resultCtx.createImageData(outW, outH)

  // Convert from NCHW to RGBA
  for (let h = 0; h < outH; h++) {
    for (let w = 0; w < outW; w++) {
      const dstIdx = (h * outW + w) * 4
      for (let c = 0; c < 3; c++) {
        const srcIdx = c * outH * outW + h * outW + w
        resultImageData.data[dstIdx + c] = outputData[srcIdx]
      }
      resultImageData.data[dstIdx + 3] = 255 // Alpha
    }
  }

  // If output size matches original, return directly
  if (outW === originalWidth && outH === originalHeight) {
    return resultImageData
  }

  // Otherwise resize to original dimensions
  resultCtx.putImageData(resultImageData, 0, 0)

  const finalCanvas = new OffscreenCanvas(originalWidth, originalHeight)
  const finalCtx = finalCanvas.getContext('2d')!
  finalCtx.drawImage(resultCanvas, 0, 0, originalWidth, originalHeight)

  return finalCtx.getImageData(0, 0, originalWidth, originalHeight)
}

/**
 * Remove object from the selected region
 */
async function removeObject(): Promise<void> {
  // Get current image
  const imageData = await pixra.workspace.getActiveImage()
  if (!imageData) {
    await pixra.window.showErrorMessage('No image is currently open')
    return
  }

  // Get current selection
  const selection = await pixra.workspace.getSelection()
  if (!selection) {
    await pixra.window.showErrorMessage(
      'Please select a region first using the Marquee tool',
    )
    return
  }

  // Validate selection
  if (selection.width < 1 || selection.height < 1) {
    await pixra.window.showErrorMessage('Selection is too small')
    return
  }

  await pixra.window.withProgress(
    { title: 'Removing Object', cancellable: false },
    async (progress) => {
      try {
        // Load model
        const model = await loadModel(progress)

        progress.report({ message: 'Preparing image...', percentage: 60 })

        // Prepare inputs
        const inputs = prepareInputs(imageData, selection)

        progress.report({ message: 'Running AI model...', percentage: 70 })

        // Run inference
        const results = await model.run(inputs)

        progress.report({ message: 'Processing result...', percentage: 90 })

        // Get output
        const outputName = Object.keys(results)[0]
        const output = results[outputName]

        // Convert to ImageData
        const resultImageData = outputToImageData(
          output,
          imageData.width,
          imageData.height,
        )

        // Update image
        await pixra.workspace.updateActiveImage(resultImageData)

        // Clear selection
        await pixra.workspace.clearSelection()

        progress.report({ message: 'Done!', percentage: 100 })
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        console.error('Remove object error:', error)
        throw new Error(`Failed to remove object: ${msg}`)
      }
    },
  )
}

/**
 * Plugin activation
 */
export function activate(context: pixra.ExtensionContext) {
  const disposable = pixra.commands.registerCommand(
    'removeObject.remove',
    removeObject,
  )
  context.subscriptions.push(disposable)
}

/**
 * Plugin deactivation
 */
export function deactivate() {
  // Clean up session if needed
  if (session) {
    session = null
  }
}

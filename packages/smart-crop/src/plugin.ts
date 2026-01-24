/**
 * Smart Crop Plugin for Pixra
 *
 * Automatically detects and removes transparent edges from images,
 * cropping to the content bounds with optional padding.
 */

import * as pixra from '@pixra/plugin-sdk'

/** Default padding in pixels to preserve around content */
const DEFAULT_PADDING = 2

/** Alpha threshold - pixels with alpha below this are considered transparent */
const ALPHA_THRESHOLD = 10

interface ContentBounds {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Find the bounding box of non-transparent content in an image
 */
function findContentBounds(
  imageData: ImageData,
  alphaThreshold: number = ALPHA_THRESHOLD,
): ContentBounds | null {
  const { width, height, data } = imageData
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1

  // Scan all pixels to find non-transparent region
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3]
      if (alpha > alphaThreshold) {
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      }
    }
  }

  // No content found
  if (maxX < 0 || maxY < 0) {
    return null
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  }
}

/**
 * Apply padding and make the bounds square by centering content
 */
function applyPaddingAndSquare(
  bounds: ContentBounds,
  padding: number,
  imageWidth: number,
  imageHeight: number,
): ContentBounds {
  // First apply padding to content bounds
  const paddedWidth = bounds.width + padding * 2
  const paddedHeight = bounds.height + padding * 2

  // Use the larger dimension to create a square
  const size = Math.max(paddedWidth, paddedHeight)

  // Calculate the center of the original content
  const centerX = bounds.x + bounds.width / 2
  const centerY = bounds.y + bounds.height / 2

  // Calculate new bounds centered on content
  let x = Math.round(centerX - size / 2)
  let y = Math.round(centerY - size / 2)

  // Clamp to image boundaries
  x = Math.max(0, Math.min(x, imageWidth - size))
  y = Math.max(0, Math.min(y, imageHeight - size))

  // If the square is larger than the image, clamp size
  const finalSize = Math.min(size, imageWidth, imageHeight)

  return {
    x,
    y,
    width: finalSize,
    height: finalSize,
  }
}

/**
 * Crop ImageData to the specified bounds
 */
function cropImageData(imageData: ImageData, bounds: ContentBounds): ImageData {
  const { x, y, width, height } = bounds
  const { width: srcWidth, data: srcData } = imageData

  const croppedData = new Uint8ClampedArray(width * height * 4)

  for (let row = 0; row < height; row++) {
    const srcOffset = ((y + row) * srcWidth + x) * 4
    const destOffset = row * width * 4
    croppedData.set(srcData.slice(srcOffset, srcOffset + width * 4), destOffset)
  }

  return new ImageData(croppedData, width, height)
}

/**
 * Smart crop the current image
 */
async function smartCrop(): Promise<void> {
  // Get current image
  const imageData = await pixra.workspace.getActiveImage()
  if (!imageData) {
    await pixra.window.showErrorMessage('No image is currently open')
    return
  }

  // Find content bounds
  const bounds = findContentBounds(imageData)
  if (!bounds) {
    await pixra.window.showWarningMessage(
      'No content found - image appears to be fully transparent',
    )
    return
  }

  // Check if cropping would have any effect
  if (
    bounds.x === 0 &&
    bounds.y === 0 &&
    bounds.width === imageData.width &&
    bounds.height === imageData.height
  ) {
    await pixra.window.showInformationMessage(
      'Image already has no transparent edges to crop',
    )
    return
  }

  // Apply padding and make square
  const paddedBounds = applyPaddingAndSquare(
    bounds,
    DEFAULT_PADDING,
    imageData.width,
    imageData.height,
  )

  // Crop the image
  const croppedImage = cropImageData(imageData, paddedBounds)

  // Update the image
  await pixra.workspace.updateActiveImage(croppedImage)
}

/**
 * Plugin activation
 */
export function activate(context: pixra.ExtensionContext) {
  const disposable = pixra.commands.registerCommand('smartCrop.crop', smartCrop)
  context.subscriptions.push(disposable)
}

/**
 * Plugin deactivation
 */
export function deactivate() {
  // Nothing to clean up
}

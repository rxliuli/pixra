/**
 * Workspace API implementations
 * Handles image data access and manipulation
 */

import { fileSave } from '@/lib/fileSave'
import { appStateStore } from '../../../components/store'
import type { ApiContext } from './index'

/**
 * Convert ImageBitmap to ImageData
 */
function imageBitmapToImageData(bitmap: ImageBitmap): ImageData {
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0)
  return ctx.getImageData(0, 0, bitmap.width, bitmap.height)
}

/**
 * Convert ImageData to ImageBitmap
 */
async function imageDataToImageBitmap(
  imageData: ImageData,
): Promise<ImageBitmap> {
  return createImageBitmap(imageData)
}

/**
 * Get the currently active image as ImageData
 */
export async function getActiveImage(
  _ctx: ApiContext,
): Promise<ImageData | null> {
  const { imageData } = appStateStore.sceneStore
  if (!imageData) {
    return null
  }
  return imageBitmapToImageData(imageData)
}

/**
 * Update the active image with new ImageData
 */
export async function updateActiveImage(
  _ctx: ApiContext,
  imageData: ImageData,
): Promise<void> {
  const bitmap = await imageDataToImageBitmap(imageData)
  appStateStore.sceneStore.setImageData(bitmap)
}

/**
 * Download a file to the user's device
 */
export async function downloadFile(
  _ctx: ApiContext,
  filename: string,
  data: ArrayBuffer,
): Promise<void> {
  fileSave(new Blob([data]), filename)
}

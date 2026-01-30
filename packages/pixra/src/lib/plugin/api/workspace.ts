/**
 * Workspace API implementations
 * Handles image data access and manipulation
 */

import { appStateStore } from '../../../components/store'
import type { ApiContext } from './index'
import { toJS } from 'mobx'

/**
 * Tab metadata interface
 */
export interface TabMetadata {
  readonly id: string
  readonly name: string
  readonly filePath?: string
  readonly isDirty: boolean
}

/**
 * Get the currently active tab metadata
 */
export async function getActiveTab(
  _ctx: ApiContext,
): Promise<TabMetadata | undefined> {
  const tab = appStateStore.tabStore.activeTab
  if (!tab) {
    return undefined
  }
  return {
    id: tab.id,
    name: tab.name,
    filePath: tab.filePath,
    isDirty: tab.isDirty,
  }
}

/**
 * Get all tabs metadata
 */
export async function getAllTabs(
  _ctx: ApiContext,
): Promise<readonly TabMetadata[]> {
  return appStateStore.tabStore.tabList.map((tab) => ({
    id: tab.id,
    name: tab.name,
    filePath: tab.filePath,
    isDirty: tab.isDirty,
  }))
}

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
 * Selection rectangle interface
 */
export interface SelectionRect {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Get the current selection (relative to the original image coordinates)
 */
export async function getSelection(
  _ctx: ApiContext,
): Promise<SelectionRect | null> {
  return toJS(appStateStore.editorStore.selection)
}

/**
 * Clear the current selection
 */
export async function clearSelection(_ctx: ApiContext): Promise<void> {
  appStateStore.editorStore.clearSelection()
}

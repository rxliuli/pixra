/**
 * macOS Screenshot Crop Plugin for Pixra
 *
 * Crops macOS screenshot window rounded corners (including shadow)
 * and makes them transparent.
 */

import * as pixra from '@pixra/plugin-sdk'
import { processCorners } from './core'

/** Default corner radius for macOS window screenshots (includes shadow area) */
const DEFAULT_CORNER_RADIUS = 45

/**
 * Main function to crop macOS screenshot corners
 */
async function cropMacOSScreenshot(): Promise<void> {
  const imageData = await pixra.workspace.getActiveImage()
  if (!imageData) {
    await pixra.window.showErrorMessage('No image is currently open')
    return
  }

  const { width, height, data } = imageData

  const newData = processCorners(data, width, height, DEFAULT_CORNER_RADIUS)
  const newImageData = new ImageData(newData, width, height) as ImageData
  await pixra.workspace.updateActiveImage(newImageData)

  await pixra.window.showInformationMessage(
    `Processed 4 corners with radius: ${DEFAULT_CORNER_RADIUS}px`,
  )
}

/**
 * Plugin activation
 */
export function activate(context: pixra.ExtensionContext) {
  const disposable = pixra.commands.registerCommand(
    'macos-screenshot-crop.crop',
    cropMacOSScreenshot,
  )
  context.subscriptions.push(disposable)
}

/**
 * Plugin deactivation
 */
export function deactivate() {
  // Nothing to clean up
}

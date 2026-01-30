/**
 * Chrome Extension Icons Plugin for Pixra
 *
 * Exports the current image as Chrome extension icons in multiple sizes:
 * 16x16, 32x32, 48x48, 96x96, 128x128
 * All icons are packaged into a ZIP file for download.
 */

import * as pixra from '@pixra/plugin-sdk'
import JSZip from 'jszip'

const ICON_SIZES = [16, 32, 48, 96, 128] as const

/**
 * Resize an ImageData to the specified size
 */
async function resizeImage(imageData: ImageData, size: number): Promise<Blob> {
  const bitmap = await createImageBitmap(imageData)
  const canvas = new OffscreenCanvas(size, size)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, size, size)
  return canvas.convertToBlob({ type: 'image/png' })
}

/**
 * Export Chrome extension icons
 */
async function exportChromeIcons(): Promise<void> {
  // Get current image
  const imageData = await pixra.workspace.getActiveImage()
  if (!imageData) {
    await pixra.window.showErrorMessage('No image is currently open')
    return
  }

  // Create ZIP file
  const zip = new JSZip()

  // Generate icons for each size
  for (const size of ICON_SIZES) {
    const blob = await resizeImage(imageData, size)
    const arrayBuffer = await blob.arrayBuffer()
    zip.file(`icon-${size}.png`, arrayBuffer)
  }

  // Generate ZIP
  const zipBlob = await zip.generateAsync({ type: 'arraybuffer' })

  // Get the original filename from the active tab
  const activeTab = await pixra.tabs.getActive()
  const baseName = activeTab?.name.replace(/\.[^.]+$/, '')
  if (!baseName) {
    throw new Error('Failed to determine base filename from active tab')
  }
  const filename = `${baseName}-chrome-icons.zip`

  // Download
  await pixra.window.saveFile({ filename, data: zipBlob })

  await pixra.window.showInformationMessage(
    `Exported ${ICON_SIZES.length} icons: ${ICON_SIZES.join(', ')}px`,
  )
}

/**
 * Plugin activation
 */
export function activate(context: pixra.ExtensionContext) {
  const disposable = pixra.commands.registerCommand(
    'chromeIcons.export',
    exportChromeIcons,
  )

  context.subscriptions.push(disposable)
}

/**
 * Plugin deactivation
 */
export function deactivate() {
  // Nothing to clean up
}

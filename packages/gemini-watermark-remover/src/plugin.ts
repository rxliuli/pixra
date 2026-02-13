import * as pixra from '@pixra/plugin-sdk'
import { getWatermarkConfig, getAlphaMap, removeWatermark } from './watermark'

async function removeGeminiWatermark(): Promise<void> {
  const imageData = await pixra.workspace.getActiveImage()
  if (!imageData) {
    await pixra.window.showErrorMessage('No image is currently open')
    return
  }

  const { width, height } = imageData
  const { logoSize, margin } = getWatermarkConfig(width, height)
  const x = width - margin - logoSize
  const y = height - margin - logoSize

  if (x < 0 || y < 0) {
    await pixra.window.showErrorMessage('Image is too small for watermark removal')
    return
  }

  const alphaMap = await getAlphaMap(logoSize)
  removeWatermark(imageData, alphaMap, x, y, logoSize)
  await pixra.workspace.updateActiveImage(imageData)

  await pixra.window.showInformationMessage(
    `Removed Gemini watermark (${logoSize}x${logoSize}px)`,
  )
}

export function activate(context: pixra.ExtensionContext) {
  const disposable = pixra.commands.registerCommand(
    'gemini-watermark-remover.remove',
    removeGeminiWatermark,
  )
  context.subscriptions.push(disposable)
}

export function deactivate() {}

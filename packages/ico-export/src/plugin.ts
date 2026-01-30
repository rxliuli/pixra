/**
 * ICO Export Plugin for Pixra
 *
 * Exports the current image as a Windows .ico file.
 * The generated .ico contains multiple PNG-based icon images.
 */

import * as pixra from '@pixra/plugin-sdk'

const ICON_SIZES = [16, 32] as const

async function resizeToSquarePng(
  imageData: ImageData,
  size: number,
): Promise<ArrayBuffer> {
  const bitmap = await createImageBitmap(imageData)
  try {
    const canvas = new OffscreenCanvas(size, size)
    const ctx = canvas.getContext('2d')!

    // Clear to transparent
    ctx.clearRect(0, 0, size, size)

    // Contain: preserve aspect ratio and center
    const scale = Math.min(size / bitmap.width, size / bitmap.height)
    const drawWidth = Math.max(1, Math.round(bitmap.width * scale))
    const drawHeight = Math.max(1, Math.round(bitmap.height * scale))
    const offsetX = Math.round((size - drawWidth) / 2)
    const offsetY = Math.round((size - drawHeight) / 2)

    ctx.drawImage(bitmap, offsetX, offsetY, drawWidth, drawHeight)

    const blob = await canvas.convertToBlob({ type: 'image/png' })
    return await blob.arrayBuffer()
  } finally {
    bitmap.close()
  }
}

function writeIco(pngImages: ArrayBuffer[], sizes: number[]): ArrayBuffer {
  if (pngImages.length !== sizes.length) {
    throw new Error('writeIco: pngImages and sizes length mismatch')
  }

  const count = pngImages.length
  const headerSize = 6 + 16 * count
  const totalSize =
    headerSize + pngImages.reduce((sum, buf) => sum + buf.byteLength, 0)

  const out = new ArrayBuffer(totalSize)
  const view = new DataView(out)
  const outBytes = new Uint8Array(out)

  // ICONDIR
  view.setUint16(0, 0, true) // reserved
  view.setUint16(2, 1, true) // type: 1 = icon
  view.setUint16(4, count, true)

  let imageOffset = headerSize

  for (let i = 0; i < count; i++) {
    const size = sizes[i]
    const png = pngImages[i]
    const entryOffset = 6 + i * 16

    // ICONDIRENTRY
    view.setUint8(entryOffset + 0, size === 256 ? 0 : size) // width
    view.setUint8(entryOffset + 1, size === 256 ? 0 : size) // height
    view.setUint8(entryOffset + 2, 0) // color count
    view.setUint8(entryOffset + 3, 0) // reserved
    view.setUint16(entryOffset + 4, 1, true) // planes
    view.setUint16(entryOffset + 6, 32, true) // bit count
    view.setUint32(entryOffset + 8, png.byteLength, true) // bytes in resource
    view.setUint32(entryOffset + 12, imageOffset, true) // image offset

    outBytes.set(new Uint8Array(png), imageOffset)
    imageOffset += png.byteLength
  }

  return out
}

function formatTimestampForFilename(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    date.getFullYear() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    '-' +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  )
}

async function exportIco(): Promise<void> {
  const activeImage = await pixra.workspace.getActiveImage()
  if (!activeImage) {
    await pixra.window.showErrorMessage('No image is currently open')
    return
  }

  await pixra.window.withProgress(
    { title: 'Exporting ICO...', cancellable: false },
    async (progress) => {
      const pngBuffers: ArrayBuffer[] = []
      const sizes = [...ICON_SIZES]

      for (let i = 0; i < sizes.length; i++) {
        const size = sizes[i]
        progress.report({
          message: `Rendering ${size}x${size}...`,
          percentage: (i / sizes.length) * 85,
        })
        pngBuffers.push(await resizeToSquarePng(activeImage, size))
      }

      progress.report({ message: 'Packaging .ico...', percentage: 90 })
      const ico = writeIco(pngBuffers, sizes)

      const timestamp = formatTimestampForFilename(new Date())
      const filename = `pixra-icon-${timestamp}.ico`

      progress.report({ message: 'Saving file...', percentage: 98 })
      await pixra.window.saveFile({ filename, data: ico })

      await pixra.window.showInformationMessage(
        `Exported ICO (${sizes.join('/')})`,
      )
    },
  )
}

export function activate(context: pixra.ExtensionContext) {
  const disposable = pixra.commands.registerCommand(
    'icoExport.export',
    exportIco,
  )
  context.subscriptions.push(disposable)
}

export function deactivate() {
  // Nothing to clean up
}

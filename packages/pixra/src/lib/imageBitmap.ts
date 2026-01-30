export interface ImageBitmapToBlobOptions {
  mimeType?: 'image/png' | 'image/jpeg'
  quality?: number
  width?: number
  height?: number
}

export async function imageBitmapToBlob(
  imageData: ImageBitmap,
  options: ImageBitmapToBlobOptions = {},
): Promise<Blob> {
  const {
    mimeType = 'image/png',
    quality,
    width = imageData.width,
    height = imageData.height,
  } = options

  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(width, height)
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Failed to get canvas context')
    }
    ctx.drawImage(imageData, 0, 0, width, height)
    return canvas.convertToBlob({ type: mimeType, quality })
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }
  ctx.drawImage(imageData, 0, 0, width, height)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob'))
          return
        }
        resolve(blob)
      },
      mimeType,
      quality,
    )
  })
}

export async function imageBitmapToArrayBuffer(
  imageData: ImageBitmap,
): Promise<ArrayBuffer> {
  const blob = await imageBitmapToBlob(imageData, { mimeType: 'image/png' })
  return blob.arrayBuffer()
}

export interface CreateBlankImageOptions {
  width: number
  height: number
  fillColor?: string
}

export async function createBlankImageBitmap(
  options: CreateBlankImageOptions,
): Promise<ImageBitmap> {
  const { width, height, fillColor = '#ffffff' } = options

  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(width, height)
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Failed to get canvas context')
    }
    ctx.fillStyle = fillColor
    ctx.fillRect(0, 0, width, height)
    const blob = await canvas.convertToBlob({ type: 'image/png' })
    return createImageBitmap(blob)
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }
  ctx.fillStyle = fillColor
  ctx.fillRect(0, 0, width, height)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png')
  })
  return createImageBitmap(blob)
}

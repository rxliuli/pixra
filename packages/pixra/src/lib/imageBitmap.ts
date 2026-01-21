/**
 * ImageBitmap 转换工具函数
 */

export interface ImageBitmapToBlobOptions {
  mimeType?: 'image/png' | 'image/jpeg'
  quality?: number
  width?: number
  height?: number
}

/**
 * 将 ImageBitmap 转换为 Blob
 */
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

  // 优先使用 OffscreenCanvas（支持 Worker 环境）
  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(width, height)
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Failed to get canvas context')
    }
    ctx.drawImage(imageData, 0, 0, width, height)
    return canvas.convertToBlob({ type: mimeType, quality })
  }

  // 回退到 HTMLCanvasElement
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

/**
 * 将 ImageBitmap 转换为 ArrayBuffer
 */
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

/**
 * 创建空白图片的 ImageBitmap
 */
export async function createBlankImageBitmap(
  options: CreateBlankImageOptions,
): Promise<ImageBitmap> {
  const { width, height, fillColor = '#ffffff' } = options

  // 优先使用 OffscreenCanvas
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

  // 回退到 HTMLCanvasElement
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

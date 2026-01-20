import type { BuiltinAction } from '../actions/types'
import { appStateStore } from '../store'
import type { ExportOptions } from '../gui/ExportDialog'

/**
 * 将 ImageBitmap 转换为 Blob 并下载（支持尺寸调整）
 */
export async function exportImageWithOptions(
  imageData: ImageBitmap,
  options: ExportOptions,
  originalFileName?: string,
): Promise<void> {
  // 创建临时画布
  const canvas = document.createElement('canvas')
  canvas.width = options.width
  canvas.height = options.height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  // 绘制图片到画布（缩放到目标尺寸）
  ctx.drawImage(imageData, 0, 0, options.width, options.height)

  const mimeType = options.format === 'png' ? 'image/png' : 'image/jpeg'
  const extension = options.format === 'png' ? 'png' : 'jpg'
  
  // 使用原始文件名或生成新文件名
  const filename = originalFileName 
    ? `${originalFileName}.${extension}` 
    : `pixra-${new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]}.${extension}`

  // 转换为 Blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob'))
          return
        }

        // 创建下载链接
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.style.display = 'none'

        document.body.appendChild(a)
        a.click()

        // 清理
        setTimeout(() => {
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          resolve()
        }, 100)
      },
      mimeType,
      options.quality,
    )
  })
}

export function fileExport(): BuiltinAction {
  return {
    command: 'file.export',
    title: 'Export',
    execute: () => {
      const { imageData } = appStateStore.sceneStore

      if (!imageData) {
        console.warn('No image to export')
        return
      }

      appStateStore.exportDialogStore.open()
    },
    menu: {
      group: 'file',
    },
  }
}

import type { BuiltinAction } from '../actions/types'
import { appStateStore } from '../store'
import type { ExportOptions } from '../gui/ExportDialog'
import { imageBitmapToBlob } from '@/lib/imageBitmap'
import { fileSave } from '@/lib/fileSave'

/**
 * 将 ImageBitmap 转换为 Blob 并下载（支持尺寸调整）
 */
export async function exportImageWithOptions(
  imageData: ImageBitmap,
  options: ExportOptions,
  originalFileName?: string,
): Promise<void> {
  const mimeType = options.format === 'png' ? 'image/png' : 'image/jpeg'
  const extension = options.format === 'png' ? 'png' : 'jpg'

  // 使用原始文件名或生成新文件名
  const filename = originalFileName
    ? `${originalFileName}.${extension}`
    : `pixra-${new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]}.${extension}`

  const blob = await imageBitmapToBlob(imageData, {
    mimeType,
    quality: options.quality,
    width: options.width,
    height: options.height,
  })

  fileSave(blob, filename)
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

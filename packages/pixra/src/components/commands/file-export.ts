import type { BuiltinAction } from '../actions/types'
import { appStateStore } from '../store'
import { ExportOptionsContent, type ExportOptions } from '../gui/ExportOptionsContent'
import { imageBitmapToBlob } from '@/lib/imageBitmap'
import { fileSave } from '@/lib/fileSave'
import { ui } from '@/lib/window'

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
    enablement: 'hasActiveDocument',
    execute: async () => {
      const { imageData, originalFileName } = appStateStore.sceneStore

      if (!imageData) {
        console.warn('No image to export')
        return
      }

      let exportOptions: ExportOptions = {
        format: 'png',
        width: imageData.width,
        height: imageData.height,
        quality: 0.95,
        maintainAspectRatio: true,
      }

      const result = await ui.showDialog(ExportOptionsContent, {
        title: 'Export Image',
        description: 'Configure export options for your image',
        footer: true,
        props: {
          value: exportOptions,
          onChange: (value: unknown) => {
            exportOptions = value as ExportOptions
          },
          originalWidth: imageData.width,
          originalHeight: imageData.height,
        },
      })

      if (result === 'ok') {
        try {
          await exportImageWithOptions(
            imageData,
            exportOptions,
            originalFileName,
          )
        } catch (error) {
          console.error('Failed to export image:', error)
        }
      }
    },
    menu: {
      group: 'file',
    },
  }
}

import type { BuiltinAction } from '../actions/types'
import { appStateStore } from '../store'
import { imageBitmapToBlob } from '@/lib/imageBitmap'
import { fileSave } from '@/lib/fileSave'
import { ui } from '@/lib/window'
import { lazy } from 'react'
import type { ExportOptions } from '../gui/ExportOptionsContent'

export function fileExportAll(): BuiltinAction {
  return {
    command: 'file.export-all',
    title: 'Export All',
    enablement: 'hasActiveTab',
    execute: async () => {
      const JSZip = (await import('jszip')).default

      const { tabStore } = appStateStore
      const tabs = tabStore.tabList

      if (tabs.length === 0) {
        ui.showWarningMessage('No images to export')
        return
      }

      // Use first image dimensions as default
      const firstImage = tabs[0].imageData!
      let exportOptions: ExportOptions = {
        format: 'png',
        width: firstImage.width,
        height: firstImage.height,
        quality: 0.95,
        maintainAspectRatio: true,
      }

      const LazyExportOptionsContent = lazy(() =>
        import('../gui/ExportOptionsContent').then((mod) => ({
          default: mod.ExportOptionsContent,
        })),
      )
      const result = await ui.showDialog(LazyExportOptionsContent, {
        title: 'Export All Images',
        description: `Export all ${tabs.length} open images as a ZIP archive`,
        footer: true,
        props: {
          value: exportOptions,
          onChange: (value: unknown) => {
            exportOptions = value as ExportOptions
          },
          originalWidth: firstImage.width,
          originalHeight: firstImage.height,
        },
      })

      if (result === 'ok') {
        await ui.withProgress(
          { title: 'Exporting images...' },
          async (progress) => {
            try {
              const zip = new JSZip()
              const mimeType =
                exportOptions.format === 'png' ? 'image/png' : 'image/jpeg'
              const extension = exportOptions.format === 'png' ? 'png' : 'jpg'

              for (let i = 0; i < tabs.length; i++) {
                const tab = tabs[i]
                progress.report({
                  message: `${i + 1}/${tabs.length}: ${tab.name}`,
                  percentage: (i / tabs.length) * 100,
                })

                const blob = await imageBitmapToBlob(tab.imageData!, {
                  mimeType,
                  quality: exportOptions.quality,
                  width: exportOptions.width,
                  height: exportOptions.height,
                })

                const fileName = `${tab.name}.${extension}`
                zip.file(fileName, blob)
              }

              progress.report({ message: 'Creating ZIP...', percentage: 95 })
              const zipBlob = await zip.generateAsync({ type: 'blob' })

              const timestamp = new Date()
                .toISOString()
                .replace(/[:.]/g, '-')
                .split('T')[0]
              fileSave(zipBlob, `pixra-export-${timestamp}.zip`)

              ui.showInformationMessage(
                `Successfully exported ${tabs.length} image${tabs.length !== 1 ? 's' : ''}`,
              )
            } catch (error) {
              console.error('Failed to export images:', error)
              ui.showErrorMessage('Failed to export images')
            }
          },
        )
      }
    },
    menu: {
      group: 'file',
    },
  }
}

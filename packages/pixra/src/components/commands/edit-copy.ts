import type { BuiltinAction } from '../actions/types'
import { appStateStore } from '../store'
import { imageBitmapToBlob } from '@/lib/imageBitmap'

export function editCopy(): BuiltinAction {
  return {
    command: 'edit.copy',
    title: 'Copy',
    enablement: 'hasActiveTab',
    execute: async () => {
      const tab = appStateStore.tabStore.activeTab
      if (!tab || !tab.imageData) {
        return
      }

      try {
        const blob = await imageBitmapToBlob(tab.imageData, {
          mimeType: 'image/png',
        })
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob,
          }),
        ])
      } catch (error) {
        console.error('Failed to copy image to clipboard:', error)
      }
    },
    keybinding: {
      key: 'ctrl+c',
      mac: 'cmd+c',
    },
    menu: {
      group: 'edit',
    },
  }
}

import type { BuiltinAction } from '../actions/types'
import { appStateStore } from '../store'

export function editRemoveBg(): BuiltinAction {
  return {
    command: 'edit.removeBg',
    title: 'Remove Background',
    execute: async () => {
      const { imageData } = appStateStore.sceneStore
      if (!imageData) {
        console.warn('No image loaded')
        return
      }

      try {
        await appStateStore.progressStore.withProgress(
          {
            title: 'Removing Background',
            cancellable: false,
          },
          async (progress) => {
            const { removeBg } = await import('@/lib/removeBg')
            const newImageData = await removeBg(imageData, {
              onProgress: (message, percentage) => {
                progress.report({ message, percentage })
              },
            })

            // 更新场景中的图片
            appStateStore.sceneStore.setImageData(newImageData)
          }
        )
      } catch (error) {
        console.error('Failed to remove background:', error)
        throw error
      }
    },
    keybinding: {
      key: 'ctrl+shift+b',
      mac: 'cmd+shift+b',
    },
    menu: {
      group: 'edit',
      order: 100,
    },
  }
}

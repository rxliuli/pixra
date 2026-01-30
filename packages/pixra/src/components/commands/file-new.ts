import type { BuiltinAction } from '../actions/types'
import { appStateStore } from '../store'
import { createBlankImageBitmap } from '@/lib/imageBitmap'

export function fileNew(): BuiltinAction {
  return {
    command: 'file.new',
    title: 'New',
    execute: async () => {
      const width = 800
      const height = 600

      const bitmap = await createBlankImageBitmap({ width, height, fillColor: '#ffffff' })

      appStateStore.tabStore.createTab(bitmap, 'Untitled')

      await new Promise(requestAnimationFrame)
      const fitScale = appStateStore.sceneStore.calculateFitScale(
        bitmap.width,
        bitmap.height,
      )
      appStateStore.sceneStore.setScale(fitScale)
    },
    keybinding: {
      key: 'ctrl+n',
      mac: 'cmd+n',
    },
    menu: {
      group: 'file',
    },
  }
}

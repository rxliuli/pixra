import type { BuiltinAction } from '../actions/types'
import { appStateStore } from '../store'

export function viewResetZoom(): BuiltinAction {
  return {
    command: 'view.resetZoom',
    title: 'Reset Zoom',
    enablement: 'hasActiveDocument',
    execute: () => {
      const { sceneStore } = appStateStore
      const { imageData } = sceneStore
      if (imageData) {
        const fitScale = sceneStore.calculateFitScale(imageData.width, imageData.height)
        sceneStore.setScale(fitScale)
      } else {
        sceneStore.setScale(1)
      }
    },
    keybinding: {
      key: 'ctrl+0',
      mac: 'cmd+0',
    },
    menu: {
      group: 'view',
      order: 2,
    },
  }
}

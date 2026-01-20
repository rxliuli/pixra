import type { BuiltinAction } from '../actions/types'
import { appStateStore } from '../store'

export function viewZoomOut(): BuiltinAction {
  return {
    command: 'view.zoomOut',
    title: 'Zoom Out',
    execute: () => {
      const currentScale = appStateStore.sceneStore.scale
      const newScale = Math.max(currentScale / 1.2, 0.1) // 每次缩小 20%，最小 10%
      appStateStore.sceneStore.setScale(newScale)
    },
    keybinding: {
      key: 'ctrl+-',
      mac: 'cmd+-',
    },
    menu: {
      group: 'view',
      order: 1,
    },
  }
}

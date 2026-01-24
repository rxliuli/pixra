import type { BuiltinAction } from '../actions/types'
import { appStateStore } from '../store'

export function viewZoomIn(): BuiltinAction {
  return {
    command: 'view.zoomIn',
    title: 'Zoom In',
    enablement: 'hasActiveTab',
    execute: () => {
      const currentScale = appStateStore.sceneStore.scale
      const newScale = Math.min(currentScale * 1.2, 10) // 每次放大 20%，最大 1000%
      appStateStore.sceneStore.setScale(newScale)
    },
    keybinding: {
      key: 'ctrl+=',
      mac: 'cmd+=',
    },
    menu: {
      group: 'view',
      order: 0,
    },
  }
}

import type { BuiltinAction } from '../actions/types'
import { appStateStore } from '../store'

export function editDeleteSelection(): BuiltinAction {
  return {
    command: 'edit.deleteSelection',
    title: 'Delete Selection',
    enablement: 'hasActiveTab && hasSelection',
    execute: async () => {
      const { editorStore, sceneStore } = appStateStore
      const selection = editorStore.selection
      const imageData = sceneStore.imageData
      if (!selection || !imageData) {
        return
      }

      const canvas = new OffscreenCanvas(imageData.width, imageData.height)
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(imageData, 0, 0)
      ctx.clearRect(selection.x, selection.y, selection.width, selection.height)

      const newImageData = await createImageBitmap(canvas)
      sceneStore.setImageData(newImageData)
      editorStore.clearSelection()
    },
    keybinding: {
      key: 'delete',
      mac: 'backspace',
    },
    menu: {
      group: 'edit',
    },
  }
}

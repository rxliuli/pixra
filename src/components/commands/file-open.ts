import { fileSelector } from '@/lib/fileSelector'
import type { BuiltinAction } from '../actions/types'
import { fileReadAs } from '@/lib/fileReadAs'
import { appStateStore } from '../store'

export function fileOpen(): BuiltinAction {
  return {
    command: 'file.open',
    title: 'Open',
    execute: async () => {
      const files = await fileSelector({
        accept: 'image/*',
      })
      if (!files || files.length === 0) {
        return
      }
      const file = files[0]
      const dataURL = await fileReadAs(file, 'dataURL')
      if (typeof dataURL !== 'string') {
        throw new Error('Failed to read file as data URL')
      }
      const img = new Image()
      img.src = dataURL
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })
      const bitmap = await createImageBitmap(img)
      appStateStore.historyStore.clear()
      // 设置新图片
      appStateStore.sceneStore.setImageData(bitmap)
      // 保存原始文件名
      appStateStore.sceneStore.setOriginalFileName(file.name)
      // 重置视图并计算适配缩放
      appStateStore.sceneStore.resetView()
      const fitScale = appStateStore.sceneStore.calculateFitScale(
        bitmap.width,
        bitmap.height,
      )
      appStateStore.sceneStore.setScale(fitScale)
    },
    keybinding: {
      key: 'ctrl+o',
      mac: 'cmd+o',
    },
    menu: {
      group: 'file',
    },
  }
}

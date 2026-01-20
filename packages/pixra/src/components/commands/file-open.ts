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

      // 获取文件名（不含扩展名）
      const fileName = file.name.replace(/\.[^/.]+$/, '')

      // 创建新文档
      appStateStore.documentStore.createDocument(bitmap, fileName)

      // 等待下一帧，确保 canvas 尺寸已更新
      await new Promise(requestAnimationFrame)
      // 计算适配缩放
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

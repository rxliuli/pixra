import type { BuiltinAction } from '../actions/types'
import { appStateStore } from '../store'

export function fileNew(): BuiltinAction {
  return {
    command: 'file.new',
    title: 'New',
    execute: async () => {
      // 创建默认尺寸的白色画布
      const width = 800
      const height = 600

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, width, height)
      }

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve),
      )
      if (!blob) return

      const bitmap = await createImageBitmap(blob)

      // 创建新文档
      appStateStore.documentStore.createDocument(bitmap, 'Untitled')

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
      key: 'ctrl+n',
      mac: 'cmd+n',
    },
    menu: {
      group: 'file',
      order: 0,
    },
  }
}

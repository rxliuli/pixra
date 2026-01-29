import type { BuiltinAction } from '../actions/types'
import { appStateStore } from '../store'
import { createBlankImageBitmap } from '@/lib/imageBitmap'

export function fileNew(): BuiltinAction {
  return {
    command: 'file.new',
    title: 'New',
    execute: async () => {
      // 创建默认尺寸的白色画布
      const width = 800
      const height = 600

      const bitmap = await createBlankImageBitmap({ width, height, fillColor: '#ffffff' })

      // 创建新标签页
      appStateStore.tabStore.createTab(bitmap, 'Untitled')

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
    },
  }
}

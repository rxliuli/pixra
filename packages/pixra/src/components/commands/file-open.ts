import { fileSelector } from '@/lib/fileSelector'
import type { BuiltinAction } from '../actions/types'
import { appStateStore } from '../store'
import { isFileSystemAccessSupported, setFileHandle } from '@/lib/fileHandleStore'

const IMAGE_FILE_TYPES = [
  {
    description: 'Image Files',
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'],
    },
  },
]

/**
 * 使用 File System Access API 打开文件
 */
async function openWithFileSystemAccess(): Promise<{ file: File; handle: FileSystemFileHandle } | null> {
  try {
    const [handle] = await window.showOpenFilePicker({
      multiple: false,
      types: IMAGE_FILE_TYPES,
    })
    const file = await handle.getFile()
    return { file, handle }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return null
    }
    throw error
  }
}

/**
 * 使用传统 file input 打开文件（回退方案）
 */
async function openWithFileInput(): Promise<{ file: File; handle: null } | null> {
  const files = await fileSelector({ accept: 'image/*' })
  if (!files || files.length === 0) {
    return null
  }
  return { file: files[0], handle: null }
}

export function fileOpen(): BuiltinAction {
  return {
    command: 'file.open',
    title: 'Open',
    execute: async () => {
      // 优先使用 File System Access API
      const result = isFileSystemAccessSupported()
        ? await openWithFileSystemAccess()
        : await openWithFileInput()

      if (!result) {
        return
      }

      const { file, handle } = result
      const bitmap = await createImageBitmap(file)

      // 获取文件名（不含扩展名）
      const fileName = file.name.replace(/\.[^/.]+$/, '')

      // 创建新文档
      const docId = appStateStore.documentStore.createDocument(bitmap, fileName)

      // 保存文件句柄以便后续保存
      if (handle) {
        setFileHandle(docId, handle)
      }

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

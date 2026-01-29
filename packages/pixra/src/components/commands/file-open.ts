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

interface FileWithHandle {
  file: File
  handle: FileSystemFileHandle | null
}

/**
 * 使用 File System Access API 打开文件（支持多选）
 */
async function openWithFileSystemAccess(): Promise<FileWithHandle[] | null> {
  try {
    const handles = await window.showOpenFilePicker({
      multiple: true,
      types: IMAGE_FILE_TYPES,
    })
    const results: FileWithHandle[] = []
    for (const handle of handles) {
      const file = await handle.getFile()
      results.push({ file, handle })
    }
    return results.length > 0 ? results : null
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return null
    }
    throw error
  }
}

/**
 * 使用传统 file input 打开文件（回退方案，支持多选）
 */
async function openWithFileInput(): Promise<FileWithHandle[] | null> {
  const files = await fileSelector({ accept: 'image/*', multiple: true })
  if (!files || files.length === 0) {
    return null
  }
  return Array.from(files).map((file) => ({ file, handle: null }))
}

/**
 * 打开文件列表
 */
export async function openFiles(files: FileWithHandle[]): Promise<void> {
  for (let i = 0; i < files.length; i++) {
    const { file, handle } = files[i]
    const bitmap = await createImageBitmap(file)

    // 获取文件名（不含扩展名）
    const fileName = file.name.replace(/\.[^/.]+$/, '')

    // 只激活最后一个标签页，避免闪烁
    const isLast = i === files.length - 1
    const tabId = appStateStore.tabStore.createTab(bitmap, fileName, isLast)

    // 为每个标签页计算适配缩放
    const fitScale = appStateStore.sceneStore.calculateFitScale(
      bitmap.width,
      bitmap.height,
    )
    appStateStore.tabStore.setTabViewState(tabId, { scale: fitScale })

    // 保存文件句柄以便后续保存
    if (handle) {
      setFileHandle(tabId, handle)
    }
  }
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

      await openFiles(result)
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

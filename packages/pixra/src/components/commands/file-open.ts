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
  for (const { file, handle } of files) {
    const bitmap = await createImageBitmap(file)

    // 获取文件名（不含扩展名）
    const fileName = file.name.replace(/\.[^/.]+$/, '')

    // 创建新文档
    const docId = appStateStore.documentStore.createDocument(bitmap, fileName)

    // 保存文件句柄以便后续保存
    if (handle) {
      setFileHandle(docId, handle)
    }
  }

  // 等待下一帧，确保 canvas 尺寸已更新
  await new Promise(requestAnimationFrame)

  // 对最后一个打开的文档计算适配缩放
  const activeDoc = appStateStore.documentStore.activeDocument
  if (activeDoc?.imageData) {
    const fitScale = appStateStore.sceneStore.calculateFitScale(
      activeDoc.imageData.width,
      activeDoc.imageData.height,
    )
    appStateStore.sceneStore.setScale(fitScale)
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

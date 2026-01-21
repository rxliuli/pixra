import type { BuiltinAction } from '../actions/types'
import { appStateStore } from '../store'
import { imageBitmapToBlob } from '@/lib/imageBitmap'
import { getFileHandle, setFileHandle } from '@/lib/fileHandleStore'

const IMAGE_FILE_TYPES: FilePickerAcceptType[] = [
  {
    description: 'PNG Image',
    accept: { 'image/png': ['.png'] },
  },
  {
    description: 'JPEG Image',
    accept: { 'image/jpeg': ['.jpg', '.jpeg'] },
  },
]

/**
 * 使用 File System Access API 保存文件
 */
async function saveToFileSystem(
  blob: Blob,
  suggestedName: string,
  existingHandle?: FileSystemFileHandle,
): Promise<FileSystemFileHandle> {
  let fileHandle: FileSystemFileHandle

  if (existingHandle) {
    fileHandle = existingHandle
  } else {
    fileHandle = await window.showSaveFilePicker({
      suggestedName,
      types: IMAGE_FILE_TYPES,
    })
  }

  const writable = await fileHandle.createWritable()
  await writable.write(blob)
  await writable.close()

  return fileHandle
}

export function fileSave(): BuiltinAction {
  return {
    command: 'file.save',
    title: 'Save',
    execute: async () => {
      const doc = appStateStore.documentStore.activeDocument
      if (!doc || !doc.imageData) {
        console.warn('No document or image to save')
        return
      }

      try {
        const existingHandle = getFileHandle(doc.id)
        const suggestedName = `${doc.name || 'image'}.png`

        const blob = await imageBitmapToBlob(doc.imageData, { mimeType: 'image/png' })
        const handle = await saveToFileSystem(blob, suggestedName, existingHandle)

        // 保存文件句柄以便后续保存
        setFileHandle(doc.id, handle)

        // 标记文档为已保存
        appStateStore.documentStore.markClean()
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // 用户取消了保存对话框
          return
        }
        console.error('Failed to save file:', error)
      }
    },
    keybinding: {
      key: 'ctrl+s',
      mac: 'cmd+s',
    },
    menu: {
      group: 'file',
      order: 2,
    },
  }
}

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
    enablement: 'hasActiveTab',
    execute: async () => {
      const tab = appStateStore.tabStore.activeTab
      if (!tab || !tab.imageData) {
        console.warn('No tab or image to save')
        return
      }

      try {
        const existingHandle = getFileHandle(tab.id)
        const suggestedName = `${tab.name || 'image'}.png`

        const blob = await imageBitmapToBlob(tab.imageData, { mimeType: 'image/png' })
        const handle = await saveToFileSystem(blob, suggestedName, existingHandle)

        setFileHandle(tab.id, handle)

        appStateStore.tabStore.markClean()
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
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
    },
  }
}

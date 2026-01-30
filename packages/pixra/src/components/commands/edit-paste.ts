import type { BuiltinAction } from '../actions/types'
import { openFiles } from './file-open'

async function getImageFromClipboard(): Promise<File | null> {
  try {
    const clipboardItems = await navigator.clipboard.read()
    for (const item of clipboardItems) {
      const imageType = item.types.find((type) => type.startsWith('image/'))
      if (imageType) {
        const blob = await item.getType(imageType)
        const ext = imageType.split('/')[1] || 'png'
        const fileName = `pasted-image.${ext}`
        return new File([blob], fileName, { type: imageType })
      }
    }
    return null
  } catch (error) {
    console.error('Failed to read clipboard:', error)
    return null
  }
}

export function editPaste(): BuiltinAction {
  return {
    command: 'edit.paste',
    title: 'Paste',
    execute: async () => {
      const imageFile = await getImageFromClipboard()
      if (!imageFile) {
        return
      }
      await openFiles([{ file: imageFile, handle: null }])
    },
    keybinding: {
      key: 'ctrl+v',
      mac: 'cmd+v',
    },
    menu: {
      group: 'edit',
    },
  }
}

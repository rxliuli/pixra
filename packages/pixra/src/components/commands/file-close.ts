import type { BuiltinAction } from '../actions/types'
import { appStateStore } from '../store'
import { actionRegistry } from '../actions'
import { ui } from '@/lib/window'

export function fileClose(): BuiltinAction {
  return {
    command: 'file.close',
    title: 'Close',
    enablement: 'hasActiveDocument',
    execute: async () => {
      const { documentStore } = appStateStore
      const doc = documentStore.activeDocument
      if (!doc) return

      if (doc.isDirty) {
        const result = await ui.showQuickPick(
          [
            { label: 'Save', value: 'save' },
            { label: "Don't Save", value: 'discard' },
            { label: 'Cancel', value: 'cancel' },
          ],
          { title: `Save changes to "${doc.name}"?` },
        )

        if (!result || result.value === 'cancel') return
        if (result.value === 'save') {
          await actionRegistry.executeCommand('file.save')
        }
      }

      documentStore.closeDocument(doc.id)
    },
    keybinding: {
      key: 'ctrl+w',
      mac: 'cmd+w',
    },
    menu: {
      group: 'file',
      order: 5,
    },
  }
}

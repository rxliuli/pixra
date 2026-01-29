import type { BuiltinAction } from '../actions/types'
import { appStateStore } from '../store'
import { actionRegistry } from '../actions'
import { ui } from '@/lib/window'

export function fileClose(): BuiltinAction {
  return {
    command: 'file.close',
    title: 'Close',
    enablement: 'hasActiveTab',
    execute: async () => {
      const { tabStore } = appStateStore
      const tab = tabStore.activeTab
      if (!tab) return

      if (tab.isDirty) {
        const result = await ui.showQuickPick(
          [
            { label: 'Save', value: 'save' },
            { label: "Don't Save", value: 'discard' },
            { label: 'Cancel', value: 'cancel' },
          ],
          { title: `Save changes to "${tab.name}"?` },
        )

        if (!result || result.value === 'cancel') return
        if (result.value === 'save') {
          await actionRegistry.executeCommand('file.save')
        }
      }

      tabStore.closeTab(tab.id)
    },
    keybinding: {
      key: 'ctrl+w',
      mac: 'cmd+w',
    },
    menu: {
      group: 'file',
    },
  }
}

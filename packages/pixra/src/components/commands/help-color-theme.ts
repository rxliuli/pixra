import { ui } from '@/lib/window'
import type { BuiltinAction } from '../actions/types'
import { appStateStore } from '../store'

export function helpToggleDarkMode(): BuiltinAction {
  return {
    command: 'help.color-theme',
    title: 'Color Theme',
    execute: async () => {
      const selection = await ui.showQuickPick(
        [
          { label: 'System', value: 'system' },
          { label: 'Light', value: 'light' },
          { label: 'Dark', value: 'dark' },
        ],
        {
          title: 'Select Color Theme',
          placeholder: 'Choose a color theme for the application',
        },
      )
      if (selection?.value) {
        appStateStore.settingsStore.toggle(
          selection.value as 'system' | 'light' | 'dark',
        )
      }
    },
    menu: {
      group: 'help',
    },
  }
}

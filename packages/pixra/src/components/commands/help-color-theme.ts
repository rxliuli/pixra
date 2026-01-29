import { ui } from '@/lib/window'
import type { BuiltinAction } from '../actions/types'
import { appStateStore } from '../store'

export function helpColorTheme(): BuiltinAction {
  return {
    command: 'help.color-theme',
    title: 'Color Theme',
    execute: async () => {
      const initialValue = appStateStore.settingsStore.colorTheme
      const items = [
        { label: 'System', value: 'system' },
        { label: 'Light', value: 'light' },
        { label: 'Dark', value: 'dark' },
      ] as const
      const activeItem = items.find((it) => it.value === initialValue)
      const selection = await ui.showQuickPick([...items], {
        title: 'Select Color Theme',
        placeholder: 'Choose a color theme for the application',
        activeItem,
        onDidSelectItem: (item) => {
          appStateStore.settingsStore.toggle(
            item.value as 'system' | 'light' | 'dark',
          )
        },
      })
      if (!selection?.value) {
        appStateStore.settingsStore.toggle(initialValue)
        return
      }
      appStateStore.settingsStore.toggle(
        selection.value as 'system' | 'light' | 'dark',
      )
    },
    menu: {
      group: 'help',
    },
  }
}

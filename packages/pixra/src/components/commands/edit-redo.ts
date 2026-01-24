import type { BuiltinAction } from '../actions/types'
import { appStateStore } from '../store'

export function editRedo(): BuiltinAction {
  return {
    command: 'edit.redo',
    title: 'Redo',
    enablement: 'canRedo',
    execute: () => {
      appStateStore.tabStore.redo()
    },
    keybinding: {
      key: 'ctrl+shift+z',
      mac: 'cmd+shift+z',
    },
    menu: {
      group: 'edit',
      order: 1,
    },
  }
}

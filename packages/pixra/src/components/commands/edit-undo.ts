import type { BuiltinAction } from '../actions/types'
import { appStateStore } from '../store'

export function editUndo(): BuiltinAction {
  return {
    command: 'edit.undo',
    title: 'Undo',
    enablement: 'canUndo',
    execute: () => {
      appStateStore.tabStore.undo()
    },
    keybinding: {
      key: 'ctrl+z',
      mac: 'cmd+z',
    },
    menu: {
      group: 'edit',
    },
  }
}

import type { BuiltinAction } from '../actions/types'

export function editUndo(): BuiltinAction {
  return {
    command: 'edit.undo',
    title: 'Undo',
    execute: () => {
      console.log('Undo')
      // TODO: 实现撤销逻辑
    },
    keybinding: {
      key: 'ctrl+z',
      mac: 'cmd+z',
    },
    menu: {
      group: 'edit',
      order: 0,
    },
  }
}

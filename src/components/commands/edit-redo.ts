import type { BuiltinAction } from '../actions/types'

export function editRedo(): BuiltinAction {
  return {
    command: 'edit.redo',
    title: 'Redo',
    execute: () => {
      console.log('Redo')
      // TODO: 实现重做逻辑
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

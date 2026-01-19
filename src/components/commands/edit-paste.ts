import type { BuiltinAction } from '../actions/types'

export function editPaste(): BuiltinAction {
  return {
    command: 'edit.paste',
    title: 'Paste',
    execute: () => {
      console.log('Paste')
      // TODO: 实现粘贴逻辑
    },
    keybinding: {
      key: 'ctrl+v',
      mac: 'cmd+v',
    },
    menu: {
      group: 'edit',
      order: 5,
    },
  }
}

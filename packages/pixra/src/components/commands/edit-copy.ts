import type { BuiltinAction } from '../actions/types'

export function editCopy(): BuiltinAction {
  return {
    command: 'edit.copy',
    title: 'Copy',
    execute: () => {
      console.log('Copy')
      // TODO: 实现复制逻辑
    },
    keybinding: {
      key: 'ctrl+c',
      mac: 'cmd+c',
    },
    menu: {
      group: 'edit',
      order: 4,
    },
  }
}

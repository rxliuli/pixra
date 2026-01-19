import type { BuiltinAction } from '../actions/types'

export function editCut(): BuiltinAction {
  return {
    command: 'edit.cut',
    title: 'Cut',
    execute: () => {
      console.log('Cut')
      // TODO: 实现剪切逻辑
    },
    keybinding: {
      key: 'ctrl+x',
      mac: 'cmd+x',
    },
    menu: {
      group: 'edit',
      order: 3,
    },
  }
}

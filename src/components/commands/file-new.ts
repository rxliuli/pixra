import type { BuiltinAction } from '../actions/types'

export function fileNew(): BuiltinAction {
  return {
    command: 'file.new',
    title: 'New',
    execute: () => {
      console.log('Creating new file...')
      // TODO: 实现新建文件逻辑
    },
    keybinding: {
      key: 'ctrl+n',
      mac: 'cmd+n',
    },
    menu: {
      group: 'file',
      order: 0,
    },
  }
}

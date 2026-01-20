import type { BuiltinAction } from '../actions/types'

export function fileSave(): BuiltinAction {
  return {
    command: 'file.save',
    title: 'Save',
    execute: () => {
      console.log('Saving file...')
      // TODO: 实现保存文件逻辑
    },
    keybinding: {
      key: 'ctrl+s',
      mac: 'cmd+s',
    },
    menu: {
      group: 'file',
      order: 2,
    },
  }
}

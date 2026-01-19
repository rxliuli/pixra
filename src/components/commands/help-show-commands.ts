import type { BuiltinAction } from '../actions/types'

export function helpShowCommands(): BuiltinAction {
  return {
    command: 'help.showCommands',
    title: 'Show All Commands',
    execute: async (command: string) => {
      console.log('Show Commands')
    },
    keybinding: {
      key: 'ctrl+shift+p',
      mac: 'cmd+shift+p',
    },
    menu: {
      group: 'help',
    },
  }
}

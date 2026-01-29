import type { BuiltinAction } from '../actions/types'

export function helpSourceCode(): BuiltinAction {
  return {
    command: 'help.sourceCode',
    title: 'View Source Code',
    execute: () => {
      window.open('https://github.com/rxliuli/pixra', '_blank')
    },
    menu: {
      group: 'help',
    },
  }
}

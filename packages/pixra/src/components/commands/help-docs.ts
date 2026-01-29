import type { BuiltinAction } from '../actions/types'

export function helpDocs(): BuiltinAction {
  return {
    command: 'help.docs',
    title: 'Documentation',
    execute: () => {
      window.open('https://pixra.rxliuli.com/docs/', '_blank')
    },
    menu: {
      group: 'help',
    },
  }
}

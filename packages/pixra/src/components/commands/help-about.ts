import type { BuiltinAction } from '../actions/types'

export function helpAbout(): BuiltinAction {
  return {
    command: 'help.about',
    title: 'About',
    execute: () => {
      alert('Pixra - Image Editor v0.0.1')
    },
    menu: {
      group: 'help',
      order: 0,
    },
  }
}

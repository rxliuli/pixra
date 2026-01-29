import { ui } from '@/lib/window'
import type { BuiltinAction } from '../actions/types'

export function helpAbout(): BuiltinAction {
  return {
    command: 'help.about',
    title: 'About',
    execute: () => {
      ui.showInformationMessage('Pixra - Image Editor v0.0.1')
    },
    menu: {
      group: 'help',
    },
  }
}

import type { BuiltinAction } from '../actions/types'
import { ui } from '@/lib/window'

export function helpSettings(): BuiltinAction {
  return {
    command: 'help.settings',
    title: 'Settings',
    menu: {
      group: 'help',
    },
    execute: async () => {
      const Component = (await import('../gui/PluginSettingsContent'))
        .PluginSettingsContent
      await ui.showDialog(Component, {
        title: 'Settings',
        footer: false,
        className: 'sm:max-w-3xl h-[500px] flex flex-col',
      })
    },
  }
}

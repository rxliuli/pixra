import type { BuiltinAction } from '../actions/types'
import { ui } from '@/lib/window'

export function pluginStore(): BuiltinAction {
  return {
    command: 'plugin.store',
    title: 'Plugin Store',
    menu: {
      group: 'plugin',
    },
    execute: async () => {
      const Component = (await import('../gui/PluginStoreContent'))
        .PluginStoreContent
      await ui.showDialog(Component, {
        title: 'Plugin Store',
        footer: false,
        className: 'sm:max-w-4xl h-[600px] flex flex-col',
      })
    },
  }
}

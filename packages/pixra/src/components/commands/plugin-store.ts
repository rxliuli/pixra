import type { BuiltinAction } from '../actions/types'
import { PluginStoreContent } from '../gui/PluginStoreContent'
import { ui } from '@/lib/window'

export function pluginStore(): BuiltinAction {
  return {
    command: 'plugin.store',
    title: 'Plugin Store',
    menu: {
      group: 'plugin',
    },
    execute: async () => {
      await ui.showDialog(PluginStoreContent, {
        title: 'Plugin Store',
        footer: false,
        className: 'sm:max-w-4xl h-[600px] flex flex-col',
      })
    },
  }
}

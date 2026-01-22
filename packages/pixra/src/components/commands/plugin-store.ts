import type { BuiltinAction } from '../actions/types'
import { appStateStore } from '../store'

export function pluginStore(): BuiltinAction {
  return {
    command: 'plugin.store',
    title: 'Plugin Store',
    menu: {
      group: 'plugin',
    },
    execute: () => {
      appStateStore.pluginStoreDialogStore.open()
    },
  }
}

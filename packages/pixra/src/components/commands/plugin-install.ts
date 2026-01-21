import { fileSelector } from '@/lib/fileSelector'
import type { BuiltinAction } from '../actions/types'
import { pluginManager } from '@/lib/plugin'
import { toast } from 'sonner'

export function pluginInstall(): BuiltinAction {
  return {
    command: 'plugin.install',
    title: 'Install Plugin from ZIP',
    menu: {
      group: 'plugin',
    },
    execute: async () => {
      const files = await fileSelector({
        accept: '.zip',
        multiple: false,
      })
      if (!files || files.length === 0) {
        return
      }
      const file = files[0]
      if (!file) {
        return
      }
      try {
        await pluginManager.installFromZip(file)
        toast.info(`Plugin installed successfully!`)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        toast.error(`Failed to install plugin: ${message}`)
      }
    },
  }
}

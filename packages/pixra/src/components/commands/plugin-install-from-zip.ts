import { fileSelector } from '@/lib/fileSelector'
import type { BuiltinAction } from '../actions/types'
import { pluginManager } from '@/lib/plugin'
import { toast } from 'sonner'
import { PluginLoader } from '@/lib/plugin/PluginLoader'
import { ui } from '@/lib/window'

export function pluginInstallFromZip(): BuiltinAction {
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
        // Check if plugin is already installed
        const loader = new PluginLoader()
        const { manifest } = await loader.loadFromZip(file)
        const existing = await pluginManager.getInstalled(manifest.id)

        if (existing) {
          const shouldUpdate = await ui.showQuickPick(
            [
              { label: 'Update', value: true },
              { label: 'Cancel', value: false },
            ],
            {
              title: `Plugin "${manifest.name}" is already installed. Update to version ${manifest.version}?`,
            },
          )
          if (!shouldUpdate) {
            return
          }
        }

        const installed = await pluginManager.installFromZip(file)
        if (installed) {
          toast.info(`Plugin installed successfully!`)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        toast.error(`Failed to install plugin: ${message}`)
      }
    },
  }
}

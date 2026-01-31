import type { BuiltinAction } from '../actions/types'
import { pluginManager } from '@/lib/plugin'
import { toast } from 'sonner'
import { ui } from '@/lib/window'
import { downloadPlugin } from '@/lib/plugin/PluginStoreService'

export function pluginCheckUpdates(): BuiltinAction {
  return {
    command: 'plugin.checkUpdates',
    title: 'Plugins: Check for Updates',
    menu: {
      group: 'plugin',
    },
    execute: async () => {
      const updates = await pluginManager.checkForUpdates()

      if (updates.length === 0) {
        toast.info('All plugins are up to date')
        return
      }

      const selected = await ui.showQuickPick(
        [
          {
            label: `Update All (${updates.length})`,
            value: 'all' as const,
          },
          ...updates.map((u) => ({
            label: `${u.name}: ${u.currentVersion} → ${u.latestVersion}`,
            value: u.id,
          })),
        ],
        {
          title: `${updates.length} plugin update(s) available`,
        },
      )

      if (!selected) {
        return
      }

      const pluginsToUpdate =
        selected.value === 'all'
          ? updates
          : updates.filter((u) => u.id === selected.value)

      for (const update of pluginsToUpdate) {
        try {
          const blob = await downloadPlugin(update.id)
          const file = new File([blob], `${update.id}.zip`, {
            type: 'application/zip',
          })
          await pluginManager.installFromZip(file)
          toast.success(`${update.name} updated to v${update.latestVersion}`)
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          toast.error(`Failed to update ${update.name}: ${message}`)
        }
      }
    },
  }
}

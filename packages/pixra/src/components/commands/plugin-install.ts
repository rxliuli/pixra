import type { BuiltinAction } from '../actions/types'
import { pluginManager } from '@/lib/plugin'

export function pluginInstall(): BuiltinAction {
  return {
    command: 'plugin.install',
    title: 'Install Plugin from ZIP',
    menu: {
      group: 'plugin',
    },
    execute: async () => {
      // Create file input
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.zip'

      return new Promise<void>((resolve, reject) => {
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0]
          if (!file) {
            resolve()
            return
          }

          try {
            await pluginManager.installFromZip(file)
            alert(`Plugin installed successfully!`)
            resolve()
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error)
            alert(`Failed to install plugin: ${message}`)
            reject(error)
          }
        }

        input.oncancel = () => {
          resolve()
        }

        input.click()
      })
    },
  }
}

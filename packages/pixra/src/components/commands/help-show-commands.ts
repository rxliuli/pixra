import type { BuiltinAction } from '../actions/types'
import { window } from '@/lib/window'
import { commandRegistry } from '../actions/CommandRegistry'
import {
  getCommandSelectionHistory,
  recordCommandSelection,
  sortByCommandSelectionHistory,
} from '@/lib/commandHistory'

export function helpShowCommands(): BuiltinAction {
  return {
    command: 'help.showCommands',
    title: 'Show All Commands',
    execute: async () => {
      const allCommands = commandRegistry.getAllCommands()
      const history = await getCommandSelectionHistory()
      const sortedCommands = sortByCommandSelectionHistory(allCommands, history)
      const result = await window.showQuickPick(
        sortedCommands.map(cmd => ({
          label: cmd.title,
          description: cmd.command,
          value: cmd.command,
        })),
        {
          title: 'Commands',
          placeholder: 'Type to search commands...',
        }
      )

      if (result?.value) {
        await recordCommandSelection(result.value)
        await commandRegistry.executeCommand(result.value)
      }
    },
    keybinding: {
      key: 'ctrl+shift+p',
      mac: 'cmd+shift+p',
    },
    menu: {
      group: 'help',
    },
  }
}

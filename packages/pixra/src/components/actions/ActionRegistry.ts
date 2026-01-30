import { commandRegistry, CommandRegistry } from './CommandRegistry'
import { menuRegistry, MenuRegistry } from './MenuRegistry'
import { keybindingRegistry, KeybindingRegistry } from './KeybindingRegistry'
import type { BuiltinAction } from './types'

/**
 * Action Registry (convenient integration)
 * Provides one-stop registration interface supporting commands, menus and keybindings
 */
export class ActionRegistry {
  private commandRegistry: CommandRegistry
  private menuRegistry: MenuRegistry
  private keybindingRegistry: KeybindingRegistry

  constructor(
    cmdRegistry?: CommandRegistry,
    mnuRegistry?: MenuRegistry,
    kbRegistry?: KeybindingRegistry,
  ) {
    this.commandRegistry = cmdRegistry || commandRegistry
    this.menuRegistry = mnuRegistry || menuRegistry
    this.keybindingRegistry = kbRegistry || keybindingRegistry

    this.keybindingRegistry.startListening((commandId: string) => {
      this.commandRegistry.executeCommand(commandId)
    })
  }

  /**
   * Register a complete Action (command + menu + keybinding)
   */
  registerAction(action: BuiltinAction): void {
    if ('submenu' in action) {
      this.registerActions(action.submenu)
      this.menuRegistry.addMenuItem(action.menu.group, {
        type: 'submenu',
        title: action.title,
        submenu: [
          { type: 'item', command: 'file.export.png', title: 'Export as PNG' },
          { type: 'item', command: 'file.export.jpg', title: 'Export as JPG' },
        ],
      })
    } else {
      this.menuRegistry.addMenuItem(
        action.menu.group,
        {
          type: 'item',
          command: action.command,
          title: action.title,
        },
        action.menu.order,
      )
      if (!action.execute) {
        throw new Error(`Action ${action.command} is missing execute function`)
      }
      this.commandRegistry.registerCommand({
        command: action.command,
        title: action.title,
        enablement: action.enablement,
        execute: () => action.execute!(),
      })
      if (action.keybinding) {
        this.keybindingRegistry.registerKeybinding({
          commandId: action.command,
          ...action.keybinding,
        })
      }
    }
  }

  registerActions(actions: BuiltinAction[]): void {
    actions.forEach((action) => this.registerAction(action))
  }

  unregisterAction(actionId: string): void {
    this.commandRegistry.unregisterCommand(actionId)
    this.keybindingRegistry.unregisterKeybinding(actionId)

    const allGroups = this.menuRegistry.getAllMenuGroups()
    allGroups.forEach((group: any) => {
      this.menuRegistry.removeMenuItem(group.id, actionId)
    })
  }

  executeCommand(commandId: string): void {
    this.commandRegistry.executeCommand(commandId)
  }

  getCommandRegistry() {
    return this.commandRegistry
  }

  getMenuRegistry() {
    return this.menuRegistry
  }

  getKeybindingRegistry() {
    return this.keybindingRegistry
  }

  dispose(): void {
    this.keybindingRegistry.stopListening()
  }
}

export const actionRegistry = new ActionRegistry()

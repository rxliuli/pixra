import { commandRegistry, CommandRegistry } from './CommandRegistry'
import { menuRegistry, MenuRegistry } from './MenuRegistry'
import { keybindingRegistry, KeybindingRegistry } from './KeybindingRegistry'
import type { BuiltinAction } from './types'

/**
 * 动作注册中心（便捷集成）
 * 提供一站式注册接口，同时支持命令、菜单和快捷键
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

    // 启动快捷键监听
    this.keybindingRegistry.startListening((commandId: string) => {
      this.commandRegistry.executeCommand(commandId)
    })
  }

  /**
   * 注册一个完整的 Action（命令 + 菜单 + 快捷键）
   */
  registerAction(action: BuiltinAction): void {
    // 注册菜单项
    // 如果包含子菜单，则忽略 execute 和 keybinding
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
      // 注册命令
      if (!action.execute) {
        throw new Error(`Action ${action.command} is missing execute function`)
      }
      this.commandRegistry.registerCommand({
        command: action.command,
        title: action.title,
        execute: () => action.execute!(action.command),
      })
      // 注册快捷键
      if (action.keybinding) {
        this.keybindingRegistry.registerKeybinding({
          commandId: action.command,
          ...action.keybinding,
        })
      }
    }
  }

  /**
   * 批量注册 Actions
   */
  registerActions(actions: BuiltinAction[]): void {
    actions.forEach((action) => this.registerAction(action))
  }

  /**
   * 注销 Action
   */
  unregisterAction(actionId: string): void {
    // 从所有 registry 中移除
    this.commandRegistry.unregisterCommand(actionId)
    this.keybindingRegistry.unregisterKeybinding(actionId)

    // 从所有菜单组中移除
    const allGroups = this.menuRegistry.getAllMenuGroups()
    allGroups.forEach((group: any) => {
      this.menuRegistry.removeMenuItem(group.id, actionId)
    })
  }

  /**
   * 执行命令
   */
  executeCommand(commandId: string): void {
    this.commandRegistry.executeCommand(commandId)
  }

  /**
   * 获取命令注册中心（用于高级用法）
   */
  getCommandRegistry() {
    return this.commandRegistry
  }

  /**
   * 获取菜单注册中心（用于高级用法）
   */
  getMenuRegistry() {
    return this.menuRegistry
  }

  /**
   * 获取快捷键注册中心（用于高级用法）
   */
  getKeybindingRegistry() {
    return this.keybindingRegistry
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.keybindingRegistry.stopListening()
  }
}

// 导出单例
export const actionRegistry = new ActionRegistry()

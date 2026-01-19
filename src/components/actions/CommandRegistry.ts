import { makeAutoObservable } from 'mobx'
import type { Command } from './types'

/**
 * 命令注册中心
 * 负责管理所有可执行命令
 */
export class CommandRegistry {
  private commands = new Map<string, Command>()

  constructor() {
    makeAutoObservable(this)
  }

  /**
   * 注册一个命令
   */
  registerCommand(command: Command): void {
    if (this.commands.has(command.id)) {
      console.warn(`Command ${command.id} already registered, overwriting...`)
    }
    this.commands.set(command.id, command)
  }

  /**
   * 批量注册命令
   */
  registerCommands(commands: Command[]): void {
    commands.forEach((cmd) => this.registerCommand(cmd))
  }

  /**
   * 注销命令
   */
  unregisterCommand(commandId: string): void {
    this.commands.delete(commandId)
  }

  /**
   * 获取命令
   */
  getCommand(commandId: string): Command | undefined {
    return this.commands.get(commandId)
  }

  /**
   * 执行命令
   */
  async executeCommand(commandId: string): Promise<void> {
    const command = this.commands.get(commandId)
    if (!command) {
      console.error(`Command ${commandId} not found`)
      return
    }

    try {
      await command.execute()
    } catch (error) {
      console.error(`Error executing command ${commandId}:`, error)
    }
  }

  /**
   * 获取所有命令
   */
  getAllCommands(): Command[] {
    return Array.from(this.commands.values())
  }

  /**
   * 检查命令是否存在
   */
  hasCommand(commandId: string): boolean {
    return this.commands.has(commandId)
  }
}

// 导出单例
export const commandRegistry = new CommandRegistry()

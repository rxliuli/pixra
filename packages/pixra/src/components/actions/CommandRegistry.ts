import { makeAutoObservable } from 'mobx'
import { toast } from 'sonner'
import type { Command } from './types'
import { whenClauseParser, WhenClauseParser } from './WhenClauseParser'

/**
 * 命令注册中心
 * 负责管理所有可执行命令
 */
export class CommandRegistry {
  private commands = new Map<string, Command>()
  private whenClauseParser: WhenClauseParser

  constructor(parser?: WhenClauseParser) {
    this.whenClauseParser = parser || whenClauseParser
    makeAutoObservable(this)
  }

  /**
   * 注册一个命令
   */
  registerCommand(command: Command): void {
    if (this.commands.has(command.command)) {
      console.warn(
        `Command ${command.command} already registered, overwriting...`,
      )
    }
    this.commands.set(command.command, command)
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

    // 检查命令是否启用
    if (!this.isCommandEnabled(commandId)) {
      console.warn(`Command ${commandId} is disabled`)
      return
    }

    try {
      await command.execute()
    } catch (error) {
      console.error(`Error executing command ${commandId}:`, error)
      const message = error instanceof Error ? error.message : String(error)
      toast.error(
        `Error executing command [${this.getCommand(commandId)?.title ?? commandId}]: ` +
          message,
      )
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

  /**
   * 检查命令是否启用
   */
  isCommandEnabled(commandId: string): boolean {
    const command = this.commands.get(commandId)
    if (!command) return false
    if (!command.enablement) return true
    return this.whenClauseParser.evaluate(command.enablement)
  }
}

// 导出单例
export const commandRegistry = new CommandRegistry()

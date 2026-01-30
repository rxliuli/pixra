import { makeAutoObservable } from 'mobx'
import { toast } from 'sonner'
import type { Command } from './types'
import { whenClauseParser, WhenClauseParser } from './WhenClauseParser'

/**
 * Command Registry
 * Manages all executable commands
 */
export class CommandRegistry {
  private commands = new Map<string, Command>()
  private whenClauseParser: WhenClauseParser

  constructor(parser?: WhenClauseParser) {
    this.whenClauseParser = parser || whenClauseParser
    makeAutoObservable(this)
  }

  registerCommand(command: Command): void {
    if (this.commands.has(command.command)) {
      console.warn(
        `Command ${command.command} already registered, overwriting...`,
      )
    }
    this.commands.set(command.command, command)
  }

  registerCommands(commands: Command[]): void {
    commands.forEach((cmd) => this.registerCommand(cmd))
  }

  unregisterCommand(commandId: string): void {
    this.commands.delete(commandId)
  }

  getCommand(commandId: string): Command | undefined {
    return this.commands.get(commandId)
  }

  async executeCommand(commandId: string): Promise<void> {
    const command = this.commands.get(commandId)
    if (!command) {
      console.error(`Command ${commandId} not found`)
      return
    }

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

  getAllCommands(): Command[] {
    return Array.from(this.commands.values())
  }

  hasCommand(commandId: string): boolean {
    return this.commands.has(commandId)
  }

  isCommandEnabled(commandId: string): boolean {
    const command = this.commands.get(commandId)
    if (!command) return false
    if (!command.enablement) return true
    return this.whenClauseParser.evaluate(command.enablement)
  }
}

export const commandRegistry = new CommandRegistry()

if (import.meta.env.DEV) {
  Reflect.set(globalThis, 'commandRegistry', commandRegistry)
}

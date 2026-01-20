import { makeAutoObservable } from 'mobx'
import type { Keybinding } from './types'

/**
 * 快捷键注册中心
 * 负责管理快捷键绑定和事件处理
 */
export class KeybindingRegistry {
  private keybindings = new Map<string, Keybinding[]>()
  private isListening = false

  constructor() {
    makeAutoObservable(this)
  }

  /**
   * 注册快捷键
   */
  registerKeybinding(keybinding: Keybinding): void {
    const bindings = this.keybindings.get(keybinding.commandId) || []
    bindings.push(keybinding)
    this.keybindings.set(keybinding.commandId, bindings)
  }

  /**
   * 批量注册快捷键
   */
  registerKeybindings(keybindings: Keybinding[]): void {
    keybindings.forEach((kb) => this.registerKeybinding(kb))
  }

  /**
   * 注销快捷键
   */
  unregisterKeybinding(commandId: string, key?: string): void {
    if (!key) {
      // 移除命令的所有快捷键
      this.keybindings.delete(commandId)
    } else {
      // 移除特定快捷键
      const bindings = this.keybindings.get(commandId)
      if (bindings) {
        const filtered = bindings.filter((kb) => kb.key !== key)
        if (filtered.length > 0) {
          this.keybindings.set(commandId, filtered)
        } else {
          this.keybindings.delete(commandId)
        }
      }
    }
  }

  /**
   * 获取命令的快捷键
   */
  getKeybindings(commandId: string): Keybinding[] {
    return this.keybindings.get(commandId) || []
  }

  /**
   * 获取所有快捷键
   */
  getAllKeybindings(): Keybinding[] {
    return Array.from(this.keybindings.values()).flat()
  }

  /**
   * 开始监听键盘事件
   */
  startListening(executeCommand: (commandId: string) => void): void {
    if (this.isListening) return

    this.handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0

      for (const [commandId, bindings] of this.keybindings.entries()) {
        for (const binding of bindings) {
          const keyToMatch = isMac && binding.mac ? binding.mac : binding.key

          if (this.matchesKeybinding(event, keyToMatch)) {
            event.preventDefault()
            executeCommand(commandId)
            return
          }
        }
      }
    }

    window.addEventListener('keydown', this.handleKeyDown)
    this.isListening = true
  }

  /**
   * 停止监听键盘事件
   */
  stopListening(): void {
    if (!this.isListening) return

    window.removeEventListener('keydown', this.handleKeyDown)
    this.isListening = false
  }

  /**
   * 检查事件是否匹配快捷键
   */
  private matchesKeybinding(event: KeyboardEvent, keyPattern: string): boolean {
    const parts = keyPattern.toLowerCase().split('+')
    const key = parts[parts.length - 1]
    const modifiers = parts.slice(0, -1)

    // 检查按键
    if (event.key.toLowerCase() !== key) {
      return false
    }

    // 检查修饰键
    const hasCtrl = modifiers.includes('ctrl') || modifiers.includes('⌘')
    const hasAlt = modifiers.includes('alt') || modifiers.includes('⌥')
    const hasShift = modifiers.includes('shift') || modifiers.includes('⇧')
    const hasMeta = modifiers.includes('meta') || modifiers.includes('cmd')

    // 在 Mac 上，cmd 和 ctrl 都映射到 metaKey
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const expectsCtrlOrMeta = hasCtrl || hasMeta
    const hasCtrlOrMeta = isMac ? event.metaKey : event.ctrlKey

    return (
      (expectsCtrlOrMeta ? hasCtrlOrMeta : !event.ctrlKey && !event.metaKey) &&
      (hasAlt ? event.altKey : !event.altKey) &&
      (hasShift ? event.shiftKey : !event.shiftKey)
    )
  }

  private handleKeyDown = (_event: KeyboardEvent) => {
    // Will be replaced in startListening
  }

  /**
   * 格式化快捷键显示
   */
  formatKeybinding(keybinding: Keybinding): string {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const key = isMac && keybinding.mac ? keybinding.mac : keybinding.key

    // 转换为显示格式
    return key
      .replace('ctrl', isMac ? '⌃' : 'Ctrl')
      .replace('cmd', '⌘')
      .replace('⌘', '⌘')
      .replace('alt', isMac ? '⌥' : 'Alt')
      .replace('shift', isMac ? '⇧' : 'Shift')
      .replace('+', '')
  }
}

// 导出单例
export const keybindingRegistry = new KeybindingRegistry()

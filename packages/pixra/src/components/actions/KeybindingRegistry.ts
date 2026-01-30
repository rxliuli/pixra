import { makeAutoObservable } from 'mobx'
import type { Keybinding } from './types'

/**
 * Keybinding Registry
 * Manages keybinding registration and event handling
 */
export class KeybindingRegistry {
  private keybindings = new Map<string, Keybinding[]>()
  private isListening = false

  constructor() {
    makeAutoObservable(this)
  }

  registerKeybinding(keybinding: Keybinding): void {
    const bindings = this.keybindings.get(keybinding.commandId) || []
    bindings.push(keybinding)
    this.keybindings.set(keybinding.commandId, bindings)
  }

  registerKeybindings(keybindings: Keybinding[]): void {
    keybindings.forEach((kb) => this.registerKeybinding(kb))
  }

  unregisterKeybinding(commandId: string, key?: string): void {
    if (!key) {
      this.keybindings.delete(commandId)
    } else {
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

  getKeybindings(commandId: string): Keybinding[] {
    return this.keybindings.get(commandId) || []
  }

  getAllKeybindings(): Keybinding[] {
    return Array.from(this.keybindings.values()).flat()
  }

  startListening(executeCommand: (commandId: string) => void): void {
    if (this.isListening) return

    this.handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0

      for (const [commandId, bindings] of this.keybindings.entries()) {
        for (const binding of bindings) {
          const keyToMatch = isMac && binding.mac ? binding.mac : binding.key

          if (this.matchesKeybinding(event, keyToMatch)) {
            // Don't intercept system edit keys in editable elements
            if (
              this.isEditableElement(event.target) &&
              this.isSystemEditKey(event)
            ) {
              return
            }
            // Don't intercept copy shortcut when text is selected
            if (this.hasTextSelection() && this.isCopyKey(event)) {
              return
            }
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

  stopListening(): void {
    if (!this.isListening) return

    window.removeEventListener('keydown', this.handleKeyDown)
    this.isListening = false
  }

  private matchesKeybinding(event: KeyboardEvent, keyPattern: string): boolean {
    const parts = keyPattern.toLowerCase().split('+')
    const key = parts[parts.length - 1]
    const modifiers = parts.slice(0, -1)

    if (event.key.toLowerCase() !== key) {
      return false
    }

    const hasCtrl = modifiers.includes('ctrl') || modifiers.includes('⌘')
    const hasAlt = modifiers.includes('alt') || modifiers.includes('⌥')
    const hasShift = modifiers.includes('shift') || modifiers.includes('⇧')
    const hasMeta = modifiers.includes('meta') || modifiers.includes('cmd')

    // On Mac, cmd and ctrl both map to metaKey
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

  private isEditableElement(target: EventTarget | null): boolean {
    if (!target || !(target instanceof HTMLElement)) return false

    const tagName = target.tagName
    if (tagName === 'INPUT' || tagName === 'TEXTAREA') return true
    if (target.isContentEditable) return true

    return false
  }

  private isSystemEditKey(event: KeyboardEvent): boolean {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const hasModifier = isMac ? event.metaKey : event.ctrlKey
    const systemKeys = ['c', 'v', 'x', 'a', 'z']

    return hasModifier && systemKeys.includes(event.key.toLowerCase())
  }

  private isCopyKey(event: KeyboardEvent): boolean {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const hasModifier = isMac ? event.metaKey : event.ctrlKey
    return hasModifier && event.key.toLowerCase() === 'c'
  }

  private hasTextSelection(): boolean {
    const selection = window.getSelection()
    return selection !== null && selection.toString().length > 0
  }

  formatKeybinding(keybinding: Keybinding): string {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const key = isMac && keybinding.mac ? keybinding.mac : keybinding.key

    return key
      .replace('ctrl', isMac ? '⌃' : 'Ctrl')
      .replace('cmd', '⌘')
      .replace('⌘', '⌘')
      .replace('alt', isMac ? '⌥' : 'Alt')
      .replace('shift', isMac ? '⇧' : 'Shift')
      .replace('+', '')
  }
}

export const keybindingRegistry = new KeybindingRegistry()

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { KeybindingRegistry } from './KeybindingRegistry'
import type { Keybinding } from './types'

describe('KeybindingRegistry', () => {
  let registry: KeybindingRegistry

  beforeEach(() => {
    registry = new KeybindingRegistry()
  })

  afterEach(() => {
    registry.stopListening()
  })

  describe('registration and retrieval', () => {
    it('should register a single keybinding', () => {
      const keybinding: Keybinding = {
        commandId: 'test.command',
        key: 'ctrl+s',
      }

      registry.registerKeybinding(keybinding)

      const bindings = registry.getKeybindings('test.command')
      expect(bindings).toHaveLength(1)
      expect(bindings[0]).toEqual(keybinding)
    })

    it('should register multiple keybindings for the same command', () => {
      const keybinding1: Keybinding = {
        commandId: 'test.command',
        key: 'ctrl+s',
      }
      const keybinding2: Keybinding = {
        commandId: 'test.command',
        key: 'ctrl+shift+s',
        mac: 'cmd+shift+s',
      }

      registry.registerKeybinding(keybinding1)
      registry.registerKeybinding(keybinding2)

      const bindings = registry.getKeybindings('test.command')
      expect(bindings).toHaveLength(2)
    })

    it('should batch register keybindings', () => {
      const keybindings: Keybinding[] = [
        { commandId: 'command1', key: 'ctrl+a' },
        { commandId: 'command2', key: 'ctrl+b' },
        { commandId: 'command3', key: 'ctrl+c' },
      ]

      registry.registerKeybindings(keybindings)

      expect(registry.getKeybindings('command1')).toHaveLength(1)
      expect(registry.getKeybindings('command2')).toHaveLength(1)
      expect(registry.getKeybindings('command3')).toHaveLength(1)
    })

    it('should get all keybindings', () => {
      const keybindings: Keybinding[] = [
        { commandId: 'command1', key: 'ctrl+a' },
        { commandId: 'command2', key: 'ctrl+b' },
        { commandId: 'command1', key: 'ctrl+shift+a' },
      ]

      registry.registerKeybindings(keybindings)

      const allBindings = registry.getAllKeybindings()
      expect(allBindings).toHaveLength(3)
    })

    it('should return empty array for non-existent command', () => {
      const bindings = registry.getKeybindings('nonexistent')
      expect(bindings).toEqual([])
    })
  })

  describe('unregister keybindings', () => {
    it('should unregister all keybindings for a command', () => {
      const keybindings: Keybinding[] = [
        { commandId: 'test.command', key: 'ctrl+s' },
        { commandId: 'test.command', key: 'ctrl+shift+s' },
      ]

      registry.registerKeybindings(keybindings)
      registry.unregisterKeybinding('test.command')

      expect(registry.getKeybindings('test.command')).toEqual([])
    })

    it('should unregister a specific keybinding', () => {
      const keybindings: Keybinding[] = [
        { commandId: 'test.command', key: 'ctrl+s' },
        { commandId: 'test.command', key: 'ctrl+shift+s' },
      ]

      registry.registerKeybindings(keybindings)
      registry.unregisterKeybinding('test.command', 'ctrl+s')

      const bindings = registry.getKeybindings('test.command')
      expect(bindings).toHaveLength(1)
      expect(bindings[0].key).toBe('ctrl+shift+s')
    })

    it('should remove entire command when unregistering last keybinding', () => {
      const keybinding: Keybinding = {
        commandId: 'test.command',
        key: 'ctrl+s',
      }

      registry.registerKeybinding(keybinding)
      registry.unregisterKeybinding('test.command', 'ctrl+s')

      expect(registry.getKeybindings('test.command')).toEqual([])
    })

    it('should not throw when unregistering non-existent keybinding', () => {
      expect(() => {
        registry.unregisterKeybinding('nonexistent')
        registry.unregisterKeybinding('nonexistent', 'ctrl+x')
      }).not.toThrow()
    })
  })

  describe('keyboard event listening', () => {
    let originalPlatform: string

    beforeEach(() => {
      originalPlatform = navigator.platform
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        writable: true,
        configurable: true,
      })
    })

    afterEach(() => {
      Object.defineProperty(navigator, 'platform', {
        value: originalPlatform,
        writable: true,
        configurable: true,
      })
    })

    it('should trigger matching keybinding', () => {
      const executeCommand = vi.fn()
      const keybinding: Keybinding = {
        commandId: 'test.command',
        key: 'ctrl+s',
      }

      registry.registerKeybinding(keybinding)
      registry.startListening(executeCommand)

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
      })
      window.dispatchEvent(event)

      expect(executeCommand).toHaveBeenCalledWith('test.command')
    })

    it('should match shift modifier', () => {
      const executeCommand = vi.fn()
      const keybinding: Keybinding = {
        commandId: 'test.command',
        key: 'ctrl+shift+p',
      }

      registry.registerKeybinding(keybinding)
      registry.startListening(executeCommand)

      const event = new KeyboardEvent('keydown', {
        key: 'p',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      })
      window.dispatchEvent(event)

      expect(executeCommand).toHaveBeenCalledWith('test.command')
    })

    it('should match alt modifier', () => {
      const executeCommand = vi.fn()
      const keybinding: Keybinding = {
        commandId: 'test.command',
        key: 'alt+f',
      }

      registry.registerKeybinding(keybinding)
      registry.startListening(executeCommand)

      const event = new KeyboardEvent('keydown', {
        key: 'f',
        altKey: true,
        bubbles: true,
      })
      window.dispatchEvent(event)

      expect(executeCommand).toHaveBeenCalledWith('test.command')
    })

    it('should match multiple modifier combination', () => {
      const executeCommand = vi.fn()
      const keybinding: Keybinding = {
        commandId: 'test.command',
        key: 'ctrl+alt+shift+t',
      }

      registry.registerKeybinding(keybinding)
      registry.startListening(executeCommand)

      const event = new KeyboardEvent('keydown', {
        key: 't',
        ctrlKey: true,
        altKey: true,
        shiftKey: true,
        bubbles: true,
      })
      window.dispatchEvent(event)

      expect(executeCommand).toHaveBeenCalledWith('test.command')
    })

    it('should not trigger when modifiers do not match', () => {
      const executeCommand = vi.fn()
      const keybinding: Keybinding = {
        commandId: 'test.command',
        key: 'ctrl+s',
      }

      registry.registerKeybinding(keybinding)
      registry.startListening(executeCommand)

      // Only s without ctrl
      const event1 = new KeyboardEvent('keydown', {
        key: 's',
        bubbles: true,
      })
      window.dispatchEvent(event1)

      // ctrl+shift+s with extra shift
      const event2 = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      })
      window.dispatchEvent(event2)

      expect(executeCommand).not.toHaveBeenCalled()
    })

    it('should not trigger when key does not match', () => {
      const executeCommand = vi.fn()
      const keybinding: Keybinding = {
        commandId: 'test.command',
        key: 'ctrl+s',
      }

      registry.registerKeybinding(keybinding)
      registry.startListening(executeCommand)

      const event = new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: true,
        bubbles: true,
      })
      window.dispatchEvent(event)

      expect(executeCommand).not.toHaveBeenCalled()
    })

    it('should prevent default for matching events', () => {
      const executeCommand = vi.fn()
      const keybinding: Keybinding = {
        commandId: 'test.command',
        key: 'ctrl+s',
      }

      registry.registerKeybinding(keybinding)
      registry.startListening(executeCommand)

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      })
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

      window.dispatchEvent(event)

      expect(preventDefaultSpy).toHaveBeenCalled()
    })

    it('should stop listening', () => {
      const executeCommand = vi.fn()
      const keybinding: Keybinding = {
        commandId: 'test.command',
        key: 'ctrl+s',
      }

      registry.registerKeybinding(keybinding)
      registry.startListening(executeCommand)
      registry.stopListening()

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
      })
      window.dispatchEvent(event)

      expect(executeCommand).not.toHaveBeenCalled()
    })

    it('should not add duplicate listeners when calling startListening multiple times', () => {
      const executeCommand = vi.fn()
      const keybinding: Keybinding = {
        commandId: 'test.command',
        key: 'ctrl+s',
      }

      registry.registerKeybinding(keybinding)
      registry.startListening(executeCommand)
      registry.startListening(executeCommand)
      registry.startListening(executeCommand)

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
      })
      window.dispatchEvent(event)

      expect(executeCommand).toHaveBeenCalledTimes(1)
    })
  })

  describe('Mac platform specific behavior', () => {
    let originalPlatform: string

    beforeEach(() => {
      originalPlatform = navigator.platform
    })

    afterEach(() => {
      Object.defineProperty(navigator, 'platform', {
        value: originalPlatform,
        writable: true,
        configurable: true,
      })
    })

    it('should use mac keybinding on Mac', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        writable: true,
        configurable: true,
      })

      const executeCommand = vi.fn()
      const keybinding: Keybinding = {
        commandId: 'test.command',
        key: 'ctrl+s',
        mac: 'cmd+s',
      }

      registry.registerKeybinding(keybinding)
      registry.startListening(executeCommand)

      const event = new KeyboardEvent('keydown', {
        key: 's',
        metaKey: true,
        bubbles: true,
      })
      window.dispatchEvent(event)

      expect(executeCommand).toHaveBeenCalledWith('test.command')
    })

    it('should correctly trigger cmd+shift+p on Mac', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        writable: true,
        configurable: true,
      })

      const executeCommand = vi.fn()
      const keybinding: Keybinding = {
        commandId: 'help.showCommands',
        key: 'ctrl+shift+p',
        mac: 'cmd+shift+p',
      }

      registry.registerKeybinding(keybinding)
      registry.startListening(executeCommand)

      const event = new KeyboardEvent('keydown', {
        key: 'p',
        metaKey: true,
        shiftKey: true,
        bubbles: true,
      })
      window.dispatchEvent(event)

      expect(executeCommand).toHaveBeenCalledWith('help.showCommands')
    })
  })

  describe('format keybinding display', () => {
    it('should format Windows/Linux keybinding', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        writable: true,
        configurable: true,
      })

      const keybinding: Keybinding = {
        commandId: 'test',
        key: 'ctrl+shift+s',
      }

      const formatted = registry.formatKeybinding(keybinding)
      expect(formatted).toContain('Ctrl')
      expect(formatted).toContain('Shift')
    })

    it('should format Mac keybinding', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        writable: true,
        configurable: true,
      })

      const keybinding: Keybinding = {
        commandId: 'test',
        key: 'ctrl+s',
        mac: 'cmd+shift+s',
      }

      const formatted = registry.formatKeybinding(keybinding)
      expect(formatted).toContain('⌘')
      expect(formatted).toContain('⇧')
    })
  })
})

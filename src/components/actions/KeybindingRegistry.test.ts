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

  describe('注册和获取', () => {
    it('应该能注册单个快捷键', () => {
      const keybinding: Keybinding = {
        commandId: 'test.command',
        key: 'ctrl+s',
      }

      registry.registerKeybinding(keybinding)

      const bindings = registry.getKeybindings('test.command')
      expect(bindings).toHaveLength(1)
      expect(bindings[0]).toEqual(keybinding)
    })

    it('应该能为同一命令注册多个快捷键', () => {
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

    it('应该能批量注册快捷键', () => {
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

    it('应该能获取所有快捷键', () => {
      const keybindings: Keybinding[] = [
        { commandId: 'command1', key: 'ctrl+a' },
        { commandId: 'command2', key: 'ctrl+b' },
        { commandId: 'command1', key: 'ctrl+shift+a' },
      ]

      registry.registerKeybindings(keybindings)

      const allBindings = registry.getAllKeybindings()
      expect(allBindings).toHaveLength(3)
    })

    it('获取不存在的命令应该返回空数组', () => {
      const bindings = registry.getKeybindings('nonexistent')
      expect(bindings).toEqual([])
    })
  })

  describe('注销快捷键', () => {
    it('应该能注销命令的所有快捷键', () => {
      const keybindings: Keybinding[] = [
        { commandId: 'test.command', key: 'ctrl+s' },
        { commandId: 'test.command', key: 'ctrl+shift+s' },
      ]

      registry.registerKeybindings(keybindings)
      registry.unregisterKeybinding('test.command')

      expect(registry.getKeybindings('test.command')).toEqual([])
    })

    it('应该能注销特定快捷键', () => {
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

    it('注销最后一个快捷键应该移除整个命令', () => {
      const keybinding: Keybinding = {
        commandId: 'test.command',
        key: 'ctrl+s',
      }

      registry.registerKeybinding(keybinding)
      registry.unregisterKeybinding('test.command', 'ctrl+s')

      expect(registry.getKeybindings('test.command')).toEqual([])
    })

    it('注销不存在的快捷键不应该报错', () => {
      expect(() => {
        registry.unregisterKeybinding('nonexistent')
        registry.unregisterKeybinding('nonexistent', 'ctrl+x')
      }).not.toThrow()
    })
  })

  describe('键盘事件监听', () => {
    let originalPlatform: string

    beforeEach(() => {
      originalPlatform = navigator.platform
      // 设置为非 Mac 平台以测试 Windows/Linux 行为
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

    it('应该能触发匹配的快捷键', () => {
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

    it('应该匹配 shift 修饰键', () => {
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

    it('应该匹配 alt 修饰键', () => {
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

    it('应该匹配多个修饰键组合', () => {
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

    it('修饰键不匹配时不应该触发', () => {
      const executeCommand = vi.fn()
      const keybinding: Keybinding = {
        commandId: 'test.command',
        key: 'ctrl+s',
      }

      registry.registerKeybinding(keybinding)
      registry.startListening(executeCommand)

      // 只按 s，没有 ctrl
      const event1 = new KeyboardEvent('keydown', {
        key: 's',
        bubbles: true,
      })
      window.dispatchEvent(event1)

      // ctrl+shift+s，多了 shift
      const event2 = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      })
      window.dispatchEvent(event2)

      expect(executeCommand).not.toHaveBeenCalled()
    })

    it('按键不匹配时不应该触发', () => {
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

    it('应该阻止匹配事件的默认行为', () => {
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

    it('应该能停止监听', () => {
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

    it('重复调用 startListening 不应该重复添加监听器', () => {
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

      // 应该只调用一次
      expect(executeCommand).toHaveBeenCalledTimes(1)
    })
  })

  describe('Mac 平台特定行为', () => {
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

    it('在 Mac 上应该使用 mac 键绑定', () => {
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

      // 在 Mac 上使用 metaKey 代替 ctrlKey
      const event = new KeyboardEvent('keydown', {
        key: 's',
        metaKey: true,
        bubbles: true,
      })
      window.dispatchEvent(event)

      expect(executeCommand).toHaveBeenCalledWith('test.command')
    })

    it('在 Mac 上 cmd+shift+p 应该能正确触发', () => {
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

  describe('格式化快捷键显示', () => {
    it('应该格式化 Windows/Linux 快捷键', () => {
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

    it('应该格式化 Mac 快捷键', () => {
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

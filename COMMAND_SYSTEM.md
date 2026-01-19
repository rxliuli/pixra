# 命令系统文档

## 架构概览

这个命令系统采用分层设计，类似 VSCode，分为三个核心层：

```
┌─────────────────────────────────────┐
│      ActionRegistry (便捷层)          │  ← 系统功能使用
├─────────────────────────────────────┤
│  CommandRegistry   │  MenuRegistry  │  ← 插件可直接访问
│  KeybindingRegistry                 │
└─────────────────────────────────────┘
```

## 核心组件

### 1. CommandRegistry (命令层)
负责管理所有可执行的命令。

```typescript
commandRegistry.registerCommand({
  id: 'my.command',
  label: 'My Command',
  execute: () => console.log('executed')
})

commandRegistry.executeCommand('my.command')
```

### 2. MenuRegistry (菜单层)
负责管理顶部菜单栏的结构。

```typescript
// 注册菜单组
menuRegistry.registerMenuGroup({
  id: 'file',
  label: 'File',
  items: []
})

// 添加菜单项
menuRegistry.addMenuItem('file', {
  type: 'item',
  commandId: 'file.open',
  label: 'Open'
})
```

### 3. KeybindingRegistry (快捷键层)
负责管理快捷键绑定和键盘事件。

```typescript
keybindingRegistry.registerKeybinding({
  commandId: 'file.open',
  key: 'ctrl+o',
  mac: 'cmd+o'
})
```

### 4. ActionRegistry (集成层)
提供便捷的一站式注册接口。

```typescript
actionRegistry.registerAction({
  id: 'file.open',
  label: 'Open',
  execute: () => { /* ... */ },
  keybinding: {
    key: 'ctrl+o',
    mac: 'cmd+o'
  },
  menu: {
    group: 'file',
    order: 0
  }
})
```

## 使用场景

### 系统功能（推荐使用 ActionRegistry）

```typescript
import { actionRegistry } from '@/components/actions'

// 一次性注册命令、菜单和快捷键
actionRegistry.registerAction({
  id: 'image.flip',
  label: 'Flip Horizontal',
  execute: () => {
    // 实现翻转逻辑
  },
  keybinding: {
    key: 'ctrl+h',
    mac: 'cmd+h'
  },
  menu: {
    group: 'edit',
    order: 10
  }
})
```

### 插件开发（灵活使用底层 API）

```typescript
import { commandRegistry, menuRegistry } from '@/components/actions'

// 插件可能只需要注册命令，不需要菜单
commandRegistry.registerCommand({
  id: 'plugin.custom',
  label: 'Custom Plugin Action',
  execute: () => { /* ... */ }
})

// 或者自定义复杂的子菜单结构
menuRegistry.addMenuItem('help', {
  type: 'submenu',
  label: 'My Plugin',
  submenu: [
    { type: 'item', commandId: 'plugin.action1' },
    { type: 'separator' },
    { type: 'item', commandId: 'plugin.action2' }
  ]
})
```

## 特性

✅ **职责分离**：每个 Registry 独立管理自己的领域  
✅ **便捷集成**：系统功能可一次性注册所有配置  
✅ **灵活扩展**：插件可精细控制每一层  
✅ **响应式**：基于 MobX，UI 自动更新  
✅ **跨平台快捷键**：自动适配 macOS/Windows/Linux  
✅ **类 VSCode**：参考成熟的编辑器架构设计

## 扩展示例

### 添加新的菜单组

```typescript
import { menuRegistry, actionRegistry } from '@/components/actions'

// 1. 创建菜单组
menuRegistry.registerMenuGroup({
  id: 'filters',
  label: 'Filters',
  items: []
}, 2) // 插入到第3个位置

// 2. 添加功能
actionRegistry.registerActions([
  {
    id: 'filter.blur',
    label: 'Blur',
    execute: () => { /* 模糊滤镜 */ },
    menu: { group: 'filters', order: 0 }
  },
  {
    id: 'filter.sharpen',
    label: 'Sharpen',
    execute: () => { /* 锐化滤镜 */ },
    menu: { group: 'filters', order: 1 }
  }
])
```

### 动态注销功能

```typescript
// 注销整个 action（从所有层移除）
actionRegistry.unregisterAction('file.export')

// 或者只移除特定层
commandRegistry.unregisterCommand('file.export')
keybindingRegistry.unregisterKeybinding('file.export')
```

## 初始化

在应用启动时调用 `registerBuiltinActions()` 注册系统内置功能：

```typescript
import { registerBuiltinActions } from '@/components/actions'

function App() {
  useEffect(() => {
    registerBuiltinActions()
  }, [])
  // ...
}
```

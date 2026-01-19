import { actionRegistry } from './ActionRegistry'
import { menuRegistry } from './MenuRegistry'

let initialized = false

/**
 * 初始化系统内置的菜单组和命令
 */
export function registerBuiltinActions() {
  // 防止重复初始化
  if (initialized) {
    return
  }
  initialized = true
  // 1. 先注册菜单组（定义菜单结构）
  menuRegistry.registerMenuGroup({ id: 'file', label: 'File', items: [] }, 0)
  menuRegistry.registerMenuGroup({ id: 'edit', label: 'Edit', items: [] }, 1)
  menuRegistry.registerMenuGroup({ id: 'view', label: 'View', items: [] }, 2)
  menuRegistry.registerMenuGroup({ id: 'help', label: 'Help', items: [] }, 3)

  // 2. 使用便捷函数注册系统功能（命令 + 菜单 + 快捷键）
  actionRegistry.registerActions([
    // File 菜单
    {
      id: 'file.new',
      label: 'New',
      execute: () => {
        console.log('Creating new file...')
        // TODO: 实现新建文件逻辑
      },
      keybinding: {
        key: 'ctrl+n',
        mac: 'cmd+n',
      },
      menu: {
        group: 'file',
        order: 0,
      },
    },
    {
      id: 'file.open',
      label: 'Open',
      execute: async () => {
        console.log('Opening file...')
        // TODO: 实现打开文件逻辑
      },
      keybinding: {
        key: 'ctrl+o',
        mac: 'cmd+o',
      },
      menu: {
        group: 'file',
        order: 1,
      },
    },
    {
      id: 'file.save',
      label: 'Save',
      execute: () => {
        console.log('Saving file...')
        // TODO: 实现保存文件逻辑
      },
      keybinding: {
        key: 'ctrl+s',
        mac: 'cmd+s',
      },
      menu: {
        group: 'file',
        order: 2,
      },
    },

    // Edit 菜单
    {
      id: 'edit.undo',
      label: 'Undo',
      execute: () => {
        console.log('Undo')
        // TODO: 实现撤销逻辑
      },
      keybinding: {
        key: 'ctrl+z',
        mac: 'cmd+z',
      },
      menu: {
        group: 'edit',
        order: 0,
      },
    },
    {
      id: 'edit.redo',
      label: 'Redo',
      execute: () => {
        console.log('Redo')
        // TODO: 实现重做逻辑
      },
      keybinding: {
        key: 'ctrl+shift+z',
        mac: 'cmd+shift+z',
      },
      menu: {
        group: 'edit',
        order: 1,
      },
    },
    {
      id: 'edit.cut',
      label: 'Cut',
      execute: () => {
        console.log('Cut')
        // TODO: 实现剪切逻辑
      },
      keybinding: {
        key: 'ctrl+x',
        mac: 'cmd+x',
      },
      menu: {
        group: 'edit',
        order: 3,
      },
    },
    {
      id: 'edit.copy',
      label: 'Copy',
      execute: () => {
        console.log('Copy')
        // TODO: 实现复制逻辑
      },
      keybinding: {
        key: 'ctrl+c',
        mac: 'cmd+c',
      },
      menu: {
        group: 'edit',
        order: 4,
      },
    },
    {
      id: 'edit.paste',
      label: 'Paste',
      execute: () => {
        console.log('Paste')
        // TODO: 实现粘贴逻辑
      },
      keybinding: {
        key: 'ctrl+v',
        mac: 'cmd+v',
      },
      menu: {
        group: 'edit',
        order: 5,
      },
    },

    // View 菜单
    {
      id: 'view.zoomIn',
      label: 'Zoom In',
      execute: () => {
        console.log('Zoom In')
        // TODO: 实现放大逻辑
      },
      keybinding: {
        key: 'ctrl+=',
        mac: 'cmd+=',
      },
      menu: {
        group: 'view',
        order: 0,
      },
    },
    {
      id: 'view.zoomOut',
      label: 'Zoom Out',
      execute: () => {
        console.log('Zoom Out')
        // TODO: 实现缩小逻辑
      },
      keybinding: {
        key: 'ctrl+-',
        mac: 'cmd+-',
      },
      menu: {
        group: 'view',
        order: 1,
      },
    },
    {
      id: 'view.resetZoom',
      label: 'Reset Zoom',
      execute: () => {
        console.log('Reset Zoom')
        // TODO: 实现重置缩放逻辑
      },
      keybinding: {
        key: 'ctrl+0',
        mac: 'cmd+0',
      },
      menu: {
        group: 'view',
        order: 2,
      },
    },

    // Help 菜单
    {
      id: 'help.about',
      label: 'About',
      execute: () => {
        console.log('About')
        alert('Pixra - Image Editor v0.1.0')
      },
      menu: {
        group: 'help',
        order: 0,
      },
    },
  ])

  // 3. 手动添加分隔符和子菜单（高级用法）
  menuRegistry.addMenuItem('edit', { type: 'separator' }, 2)

  // 添加导出子菜单
  menuRegistry.addMenuItem(
    'file',
    {
      type: 'submenu',
      label: 'Export',
      submenu: [
        { type: 'item', commandId: 'file.exportPNG', label: 'Export as PNG' },
        { type: 'item', commandId: 'file.exportJPG', label: 'Export as JPG' },
      ],
    },
    3
  )

  // 注册导出命令（不在顶级菜单中）
  actionRegistry.registerAction({
    id: 'file.exportPNG',
    label: 'Export as PNG',
    execute: () => {
      console.log('Exporting as PNG...')
      // TODO: 实现 PNG 导出逻辑
    },
  })

  actionRegistry.registerAction({
    id: 'file.exportJPG',
    label: 'Export as JPG',
    execute: () => {
      console.log('Exporting as JPG...')
      // TODO: 实现 JPG 导出逻辑
    },
  })
}

import { actionRegistry } from './ActionRegistry'
import { menuRegistry } from './MenuRegistry'
import {
  fileNew,
  fileOpen,
  fileClose,
  fileSave,
  fileExport,
  editUndo,
  editRedo,
  editCut,
  editCopy,
  editPaste,
  editRemoveBg,
  viewZoomIn,
  viewZoomOut,
  viewResetZoom,
  helpAbout,
  helpShowCommands,
  pluginInstall,
} from '../commands'

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
  menuRegistry.registerMenuGroup({ id: 'file', title: 'File', items: [] })
  menuRegistry.registerMenuGroup({ id: 'edit', title: 'Edit', items: [] })
  menuRegistry.registerMenuGroup({ id: 'view', title: 'View', items: [] })
  menuRegistry.registerMenuGroup({ id: 'tools', title: 'Tools', items: [] })
  menuRegistry.registerMenuGroup({ id: 'plugin', title: 'Plugin', items: [] })
  menuRegistry.registerMenuGroup({ id: 'help', title: 'Help', items: [] })

  // 2. 注册所有内置命令
  actionRegistry.registerActions([
    // File 菜单
    fileNew(),
    fileOpen(),
    fileClose(),
    fileSave(),
    fileExport(),

    // Edit 菜单
    editUndo(),
    editRedo(),
    editCut(),
    editCopy(),
    editPaste(),

    // View 菜单
    viewZoomIn(),
    viewZoomOut(),
    viewResetZoom(),

    // Tools 菜单
    editRemoveBg(),

    // Plugin 菜单
    pluginInstall(),

    // Help 菜单
    helpAbout(),
    helpShowCommands(),
  ])

  // 3. 手动添加分隔符
  menuRegistry.addMenuItem('edit', { type: 'separator' }, 2)
}

import { actionRegistry } from './ActionRegistry'
import { menuRegistry } from './MenuRegistry'
import {
  fileNew,
  fileOpen,
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
  menuRegistry.registerMenuGroup({ id: 'file', title: 'File', items: [] }, 0)
  menuRegistry.registerMenuGroup({ id: 'edit', title: 'Edit', items: [] }, 1)
  menuRegistry.registerMenuGroup({ id: 'view', title: 'View', items: [] }, 2)
  menuRegistry.registerMenuGroup({ id: 'help', title: 'Help', items: [] }, 3)

  // 2. 注册所有内置命令
  actionRegistry.registerActions([
    // File 菜单
    fileNew(),
    fileOpen(),
    fileSave(),
    fileExport(),

    // Edit 菜单
    editUndo(),
    editRedo(),
    editCut(),
    editCopy(),
    editPaste(),
    editRemoveBg(),

    // View 菜单
    viewZoomIn(),
    viewZoomOut(),
    viewResetZoom(),

    // Help 菜单
    helpAbout(),
    helpShowCommands(),
  ])

  // 3. 手动添加分隔符
  menuRegistry.addMenuItem('edit', { type: 'separator' }, 2)
}

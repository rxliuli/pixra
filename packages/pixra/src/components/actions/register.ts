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
  editCopy,
  editPaste,
  viewZoomIn,
  viewZoomOut,
  viewResetZoom,
  helpAbout,
  helpDocs,
  helpShowCommands,
  helpSourceCode,
  pluginInstall,
  pluginStore,
  helpColorTheme,
} from '../commands'
import { fileExportAll } from '../commands/file-export-all'

let initialized = false

export function registerBuiltinActions() {
  if (initialized) {
    return
  }
  initialized = true

  menuRegistry.registerMenuGroup({ id: 'file', title: 'File', items: [] })
  menuRegistry.registerMenuGroup({ id: 'edit', title: 'Edit', items: [] })
  menuRegistry.registerMenuGroup({ id: 'view', title: 'View', items: [] })
  menuRegistry.registerMenuGroup({ id: 'tools', title: 'Tools', items: [] })
  menuRegistry.registerMenuGroup({ id: 'plugin', title: 'Plugin', items: [] })
  menuRegistry.registerMenuGroup({ id: 'help', title: 'Help', items: [] })

  actionRegistry.registerActions([
    fileNew(),
    fileOpen(),
    fileClose(),
    fileSave(),
    fileExport(),
    fileExportAll(),

    editUndo(),
    editRedo(),
    editCopy(),
    editPaste(),

    viewZoomIn(),
    viewZoomOut(),
    viewResetZoom(),

    pluginStore(),
    pluginInstall(),

    helpShowCommands(),
    helpColorTheme(),
    helpDocs(),
    helpSourceCode(),
    helpAbout(),
  ])

  menuRegistry.addMenuItem('edit', { type: 'separator' }, 2)
}

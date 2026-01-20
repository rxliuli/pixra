import { Toolbar } from './components/gui/Toolbar'
import { Renderer } from './components/gui/Renderer'
import { ToolPanel } from './components/gui/ToolPanel'
import { SecondaryToolbar } from './components/gui/SecondaryToolbar'
import { QuickPick } from './components/gui/QuickPick'
import { ExportDialog } from './components/gui/ExportDialog'
import { ProgressDialog } from './components/gui/ProgressDialog'
import { exportImageWithOptions } from './components/commands/file-export'
import { registerBuiltinActions } from './components/actions'
import { pluginManager } from './lib/plugin'
import { observer } from 'mobx-react-lite'
import { appStateStore } from './components/store'
import { useMount } from './lib/hooks/useMount'

const App = observer(() => {
  // 初始化系统内置命令
  useMount(() => {
    registerBuiltinActions()
    // 初始化插件系统
    pluginManager.initialize()
  })

  const handleCropConfirm = () => {
    // 这个回调会传递给 Renderer
    window.dispatchEvent(new CustomEvent('crop-confirm'))
  }

  const handleCropCancel = () => {
    appStateStore.editorStore.exitCropMode()
  }

  const handleExport = async (
    options: Parameters<typeof exportImageWithOptions>[1],
  ) => {
    const { imageData, originalFileName } = appStateStore.sceneStore
    if (!imageData) return

    try {
      await exportImageWithOptions(imageData, options, originalFileName)
    } catch (error) {
      console.error('Failed to export image:', error)
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Toolbar />
      <SecondaryToolbar
        onCropConfirm={handleCropConfirm}
        onCropCancel={handleCropCancel}
      />
      <div className="flex flex-1 overflow-hidden">
        <ToolPanel />
        <Renderer className="flex-1" />
      </div>
      <QuickPick />
      <ProgressDialog />
      <ExportDialog
        open={appStateStore.exportDialogStore.isOpen}
        onOpenChange={(open) => {
          if (open) {
            appStateStore.exportDialogStore.open()
          } else {
            appStateStore.exportDialogStore.close()
          }
        }}
        originalWidth={appStateStore.sceneStore.imageData?.width || 0}
        originalHeight={appStateStore.sceneStore.imageData?.height || 0}
        onExport={handleExport}
      />
    </div>
  )
})

export default App

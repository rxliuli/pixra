import { Toolbar } from './components/gui/Toolbar'
import { Renderer } from './components/gui/Renderer'
import { ToolPanel } from './components/gui/ToolPanel'
import { SecondaryToolbar } from './components/gui/SecondaryToolbar'
import { QuickPick } from './lib/window'
import { ExportDialog } from './components/gui/ExportDialog'
import { PluginStoreDialog } from './components/gui/PluginStoreDialog'
import { TabBar } from './components/gui/TabBar'
import { WelcomePage } from './components/gui/WelcomePage'
import { Toaster } from './components/ui/sonner'
import { exportImageWithOptions } from './components/commands/file-export'
import { registerBuiltinActions } from './components/actions'
import { pluginManager } from './lib/plugin'
import { observer } from 'mobx-react-lite'
import { appStateStore } from './components/store'
import { useMount } from './lib/hooks/useMount'
import { useEffect } from 'react'

const App = observer(() => {
  const { documentStore, editorStore } = appStateStore
  const hasDocuments = documentStore.hasDocuments
  const activeDocumentId = documentStore.activeDocumentId

  // 初始化系统内置命令
  useMount(() => {
    registerBuiltinActions()
    // 初始化插件系统
    pluginManager.initialize()
  })

  // 切换文档时退出裁剪模式
  useEffect(() => {
    if (editorStore.isCropMode) {
      editorStore.exitCropMode()
    }
  }, [activeDocumentId])

  // 页面关闭前警告未保存的文档
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasDirty = documentStore.documentList.some((doc) => doc.isDirty)
      if (hasDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [documentStore.documentList])

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
      <TabBar />
      {hasDocuments && (
        <SecondaryToolbar
          onCropConfirm={handleCropConfirm}
          onCropCancel={handleCropCancel}
        />
      )}
      <div className="flex flex-1 overflow-hidden">
        {hasDocuments && <ToolPanel />}
        {hasDocuments ? (
          <Renderer key={documentStore.activeDocumentId} className="flex-1" />
        ) : (
          <WelcomePage />
        )}
      </div>
      <QuickPick />
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
      <PluginStoreDialog
        open={appStateStore.pluginStoreDialogStore.isOpen}
        onOpenChange={(open) => {
          if (open) {
            appStateStore.pluginStoreDialogStore.open()
          } else {
            appStateStore.pluginStoreDialogStore.close()
          }
        }}
      />
      <Toaster position="bottom-right" richColors closeButton />
    </div>
  )
})

export default App

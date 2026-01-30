import { Toolbar } from './components/gui/Toolbar'
import { Renderer } from './components/gui/Renderer'
import { ToolPanel } from './components/gui/ToolPanel'
import { SecondaryToolbar } from './components/gui/SecondaryToolbar'
import { QuickPick, DialogHost } from './lib/window'
import { TabBar } from './components/gui/TabBar'
import { WelcomePage } from './components/gui/WelcomePage'
import { Toaster } from './components/ui/sonner'
import {
  registerBuiltinActions,
  setupContextKeySynchronizer,
} from './components/actions'
import { pluginManager } from './lib/plugin'
import { observer } from 'mobx-react-lite'
import { appStateStore } from './components/store'
import { useMount } from './lib/hooks/useMount'
import { useEffect } from 'react'
import { useEffectOnce } from './lib/hooks/useEffectOnce'

const App = observer(() => {
  const { tabStore, editorStore } = appStateStore
  const hasTabs = tabStore.hasTabs
  const activeTabId = tabStore.activeTabId

  useMount(() => {
    registerBuiltinActions()
    setupContextKeySynchronizer()
    pluginManager.initialize()
  })

  useEffect(() => {
    if (editorStore.isCropMode) {
      editorStore.exitCropMode()
    }
  }, [activeTabId])

  useEffectOnce(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasDirty = tabStore.tabList.some((tab) => tab.isDirty)
      if (hasDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  })

  const handleCropConfirm = () => {
    window.dispatchEvent(new CustomEvent('crop-confirm'))
  }

  const handleCropCancel = () => {
    appStateStore.editorStore.exitCropMode()
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Toolbar />
      <TabBar />
      {hasTabs && (
        <SecondaryToolbar
          onCropConfirm={handleCropConfirm}
          onCropCancel={handleCropCancel}
        />
      )}
      <div className="flex flex-1 overflow-hidden">
        {hasTabs && <ToolPanel />}
        {hasTabs ? (
          <Renderer key={tabStore.activeTabId} className="flex-1" />
        ) : (
          <WelcomePage />
        )}
      </div>
      <QuickPick />
      <DialogHost />
      <Toaster position="bottom-right" richColors closeButton />
    </div>
  )
})

export default App

import { Toolbar } from './components/gui/Toolbar'
import { Renderer } from './components/gui/Renderer'
import { ToolPanel } from './components/gui/ToolPanel'
import { SecondaryToolbar } from './components/gui/SecondaryToolbar'
import { useEffect } from 'react'
import { registerBuiltinActions } from './components/actions'
import { observer } from 'mobx-react-lite'
import { appStateStore } from './components/store'

const App = observer(() => {
  // 初始化系统内置命令
  useEffect(() => {
    registerBuiltinActions()
  }, [])

  const handleCropConfirm = () => {
    // 这个回调会传递给 Renderer
    window.dispatchEvent(new CustomEvent('crop-confirm'))
  }

  const handleCropCancel = () => {
    appStateStore.editorStore.exitCropMode()
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Toolbar />
      <SecondaryToolbar onCropConfirm={handleCropConfirm} onCropCancel={handleCropCancel} />
      <div className="flex flex-1 overflow-hidden">
        <ToolPanel />
        <Renderer className="flex-1" />
      </div>
    </div>
  )
})

export default App

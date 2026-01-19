import { Toolbar } from './components/gui/Toolbar'
import { Renderer } from './components/gui/Renderer'
import { useEffect } from 'react'
import { registerBuiltinActions } from './components/actions'

function App() {
  // 初始化系统内置命令
  useEffect(() => {
    registerBuiltinActions()
  }, [])

  return (
    <div className="flex min-h-svh flex-col">
      <Toolbar />
      <Renderer className={"flex-1"} />
    </div>
  )
}

export default App

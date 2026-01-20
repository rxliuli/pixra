import { observer } from 'mobx-react-lite'
import { appStateStore, type ToolType } from '../store'
import { Crop, MousePointer2, Paintbrush, Square } from 'lucide-react'
import { Button } from '../ui/button'

const tools: { id: ToolType; icon: React.ComponentType<any>; label: string }[] = [
  { id: 'move', icon: MousePointer2, label: '移动' },
  { id: 'marquee', icon: Square, label: '矩形选框' },
  { id: 'crop', icon: Crop, label: '裁剪' },
  { id: 'brush', icon: Paintbrush, label: '画笔' },
]

export const ToolPanel = observer(() => {
  const { currentTool } = appStateStore.editorStore

  const handleToolChange = (tool: ToolType) => {
    appStateStore.editorStore.setTool(tool)
  }

  return (
    <div className="flex w-16 flex-col gap-2 border-r bg-gray-50 p-2">
      {tools.map((tool) => {
        const Icon = tool.icon
        return (
          <Button
            key={tool.id}
            variant={currentTool === tool.id ? 'default' : 'outline'}
            size="icon"
            onClick={() => handleToolChange(tool.id)}
            title={tool.label}
            className="h-12 w-12"
          >
            <Icon className="h-5 w-5" />
          </Button>
        )
      })}
    </div>
  )
})

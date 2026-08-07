import { observer } from 'mobx-react-lite'
import { appStateStore, type ToolType } from '../store'
import { Brush, Crop, MousePointer2, Square, SquareDashed } from 'lucide-react'
import { Button } from '../ui/button'

const tools: { id: ToolType; icon: React.ComponentType<any>; label: string }[] =
  [
    { id: 'move', icon: MousePointer2, label: 'Move' },
    { id: 'marquee', icon: SquareDashed, label: 'Marquee' },
    { id: 'crop', icon: Crop, label: 'Crop' },
    { id: 'brush', icon: Brush, label: 'Brush' },
    { id: 'redact', icon: Square, label: 'Redact' },
  ]

export const ToolPanel = observer(() => {
  const { currentTool } = appStateStore.editorStore

  const handleToolChange = (tool: ToolType) => {
    appStateStore.editorStore.setTool(tool)
  }

  return (
    <div className="flex flex-col gap-2 border-r border-border bg-secondary p-2">
      {tools.map((tool) => {
        const Icon = tool.icon
        return (
          <Button
            key={tool.id}
            variant={currentTool === tool.id ? 'default' : 'outline'}
            size="icon"
            onClick={() => handleToolChange(tool.id)}
            title={tool.label}
          >
            <Icon />
          </Button>
        )
      })}
    </div>
  )
})

import { observer } from 'mobx-react-lite'
import { appStateStore, type CropAspectRatio } from '../store'
import { Button } from '../ui/button'
import { Check, X } from 'lucide-react'

const aspectRatios: { value: CropAspectRatio; label: string }[] = [
  { value: 'free', label: '自由' },
  { value: '1:1', label: '1:1' },
  { value: '16:9', label: '16:9' },
  { value: '4:3', label: '4:3' },
  { value: '3:2', label: '3:2' },
]

interface SecondaryToolbarProps {
  onCropConfirm?: () => void
  onCropCancel?: () => void
}

export const SecondaryToolbar = observer(({ onCropConfirm, onCropCancel }: SecondaryToolbarProps) => {
  const { currentTool, cropAspectRatio, brushSize, brushColor } = appStateStore.editorStore

  // 裁剪工具栏
  if (currentTool === 'crop') {
    return (
      <div className="flex h-12 items-center gap-2 border-b bg-white px-4">
        <div className="flex items-center gap-1">
          <span className="mr-2 text-sm text-gray-600">裁剪比例:</span>
          {aspectRatios.map((ratio) => (
            <Button
              key={ratio.value}
              variant={cropAspectRatio === ratio.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => appStateStore.editorStore.setCropAspectRatio(ratio.value)}
            >
              {ratio.label}
            </Button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={onCropCancel}>
            <X className="mr-1 h-4 w-4" />
            取消
          </Button>
          <Button size="sm" onClick={onCropConfirm}>
            <Check className="mr-1 h-4 w-4" />
            确认
          </Button>
        </div>
      </div>
    )
  }

  // 画笔工具栏
  if (currentTool === 'brush') {
    return (
      <div className="flex h-12 items-center gap-4 border-b bg-white px-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">画笔大小:</span>
          <input
            type="range"
            min="1"
            max="50"
            value={brushSize}
            onChange={(e) => appStateStore.editorStore.setBrushSize(Number(e.target.value))}
            className="w-32"
          />
          <span className="w-8 text-sm">{brushSize}px</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">颜色:</span>
          <input
            type="color"
            value={brushColor}
            onChange={(e) => appStateStore.editorStore.setBrushColor(e.target.value)}
            className="h-8 w-16 cursor-pointer rounded border"
          />
        </div>
      </div>
    )
  }

  // 矩形选框工具栏
  if (currentTool === 'marquee') {
    return (
      <div className="flex h-12 items-center gap-2 border-b bg-white px-4">
        <span className="text-sm text-gray-600">矩形选框工具 - 拖拽鼠标创建选区</span>
      </div>
    )
  }

  // 移动工具栏
  if (currentTool === 'move') {
    return (
      <div className="flex h-12 items-center gap-2 border-b bg-white px-4">
        <span className="text-sm text-gray-600">移动工具 - 拖拽画布移动，滚轮缩放</span>
      </div>
    )
  }

  // 默认空工具栏
  return <div className="h-12 border-b bg-white" />
})

import { observer } from 'mobx-react-lite'
import { appStateStore, type CropAspectRatio } from '../store'
import { Button } from '../ui/button'
import { Check, X } from 'lucide-react'

const aspectRatios: { value: CropAspectRatio; label: string }[] = [
  { value: 'free', label: 'Free' },
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

  // Crop toolbar
  if (currentTool === 'crop') {
    return (
      <div className="flex h-12 items-center gap-2 border-b bg-white px-4">
        <div className="flex items-center gap-1">
          <span className="mr-2 text-sm text-gray-600">Aspect Ratio:</span>
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
            Cancel
          </Button>
          <Button size="sm" onClick={onCropConfirm}>
            <Check className="mr-1 h-4 w-4" />
            Confirm
          </Button>
        </div>
      </div>
    )
  }

  // Brush toolbar
  if (currentTool === 'brush') {
    return (
      <div className="flex h-12 items-center gap-4 border-b bg-white px-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Brush Size:</span>
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
          <span className="text-sm text-gray-600">Color:</span>
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

  // Marquee toolbar
  if (currentTool === 'marquee') {
    return (
      <div className="flex h-12 items-center gap-2 border-b bg-white px-4">
        <span className="text-sm text-gray-600">Marquee Tool - Drag to create a selection</span>
      </div>
    )
  }

  // Move toolbar
  if (currentTool === 'move') {
    return (
      <div className="flex h-12 items-center gap-2 border-b bg-white px-4">
        <span className="text-sm text-gray-600">Move Tool - Drag to pan, scroll to zoom</span>
      </div>
    )
  }

  // Default empty toolbar
  return <div className="h-12 border-b bg-white" />
})

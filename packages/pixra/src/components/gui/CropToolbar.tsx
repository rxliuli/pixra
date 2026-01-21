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

interface CropToolbarProps {
  onConfirm: () => void
  onCancel: () => void
}

export const CropToolbar = observer(({ onConfirm, onCancel }: CropToolbarProps) => {
  const { cropAspectRatio } = appStateStore.editorStore

  return (
    <div className="flex items-center gap-2 border-b bg-white px-4 py-2">
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
        <Button variant="outline" size="sm" onClick={onCancel}>
          <X className="mr-1 h-4 w-4" />
          Cancel
        </Button>
        <Button size="sm" onClick={onConfirm}>
          <Check className="mr-1 h-4 w-4" />
          Confirm
        </Button>
      </div>
    </div>
  )
})

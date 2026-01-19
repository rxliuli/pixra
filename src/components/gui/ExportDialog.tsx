import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export interface ExportOptions {
  format: 'png' | 'jpeg'
  width: number
  height: number
  quality: number // 0-1, only for JPEG
  maintainAspectRatio: boolean
}

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  originalWidth: number
  originalHeight: number
  onExport: (options: ExportOptions) => void
}

export function ExportDialog({
  open,
  onOpenChange,
  originalWidth,
  originalHeight,
  onExport,
}: ExportDialogProps) {
  const [format, setFormat] = useState<'png' | 'jpeg'>('png')
  const [width, setWidth] = useState(originalWidth)
  const [height, setHeight] = useState(originalHeight)
  const [quality, setQuality] = useState(95)
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true)

  const aspectRatio = originalWidth / originalHeight

  // 当对话框打开或原始尺寸改变时，重置为原始尺寸
  useEffect(() => {
    if (open) {
      setWidth(originalWidth)
      setHeight(originalHeight)
    }
  }, [open, originalWidth, originalHeight])

  const handleWidthChange = (value: number) => {
    setWidth(value)
    if (maintainAspectRatio) {
      setHeight(Math.round(value / aspectRatio))
    }
  }

  const handleHeightChange = (value: number) => {
    setHeight(value)
    if (maintainAspectRatio) {
      setWidth(Math.round(value * aspectRatio))
    }
  }

  const handleMaintainAspectRatioChange = (checked: boolean) => {
    setMaintainAspectRatio(checked)
    
    // 从不保持切换到保持时，智能调整尺寸
    if (checked) {
      const currentAspectRatio = width / height
      
      // 如果当前宽高比与原始宽高比不同，需要调整
      if (Math.abs(currentAspectRatio - aspectRatio) > 0.01) {
        // 计算两种方案：基于宽度和基于高度
        const heightBasedOnWidth = Math.round(width / aspectRatio)
        const widthBasedOnHeight = Math.round(height * aspectRatio)
        
        // 选择变化较小的方案
        const widthDiff = Math.abs(width - widthBasedOnHeight)
        const heightDiff = Math.abs(height - heightBasedOnWidth)
        
        if (widthDiff <= heightDiff) {
          // 基于高度调整宽度
          setWidth(widthBasedOnHeight)
        } else {
          // 基于宽度调整高度
          setHeight(heightBasedOnWidth)
        }
      }
    }
  }

  const handleExport = () => {
    onExport({
      format,
      width,
      height,
      quality: quality / 100,
      maintainAspectRatio,
    })
    onOpenChange(false)
  }

  const handleResetSize = () => {
    setWidth(originalWidth)
    setHeight(originalHeight)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Image</DialogTitle>
          <DialogDescription>
            Configure export options for your image
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Format Selection */}
          <div className="grid gap-2">
            <label className="text-sm font-medium">Format</label>
            <div className="flex gap-2">
              <Button
                variant={format === 'png' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setFormat('png')}
              >
                PNG
              </Button>
              <Button
                variant={format === 'jpeg' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setFormat('jpeg')}
              >
                JPEG
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {format === 'png'
                ? 'Lossless compression, supports transparency'
                : 'Lossy compression, smaller file size'}
            </p>
          </div>

          {/* Dimensions */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Dimensions</label>
              <button
                onClick={handleResetSize}
                className="text-xs text-blue-500 hover:underline"
              >
                Reset to original
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Width</label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => handleWidthChange(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border rounded-md outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Height</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => handleHeightChange(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border rounded-md outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={maintainAspectRatio}
                onChange={(e) => handleMaintainAspectRatioChange(e.target.checked)}
                className="rounded"
              />
              Maintain aspect ratio
            </label>
            <p className="text-xs text-muted-foreground">
              Original: {originalWidth} × {originalHeight}
            </p>
          </div>

          {/* Quality (JPEG only) */}
          {format === 'jpeg' && (
            <div className="grid gap-2">
              <label className="text-sm font-medium">
                Quality: {quality}%
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Higher quality = larger file size
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport}>Export</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

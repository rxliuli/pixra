import { useRef, useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { appStateStore } from '../store'
import { useEffectOnce } from '@/lib/hooks/useEffectOnce'

interface Point {
  x: number
  y: number
}

interface SelectionRect {
  x: number
  y: number
  width: number
  height: number
}

interface BrushStroke {
  points: Point[]
  color: string
  size: number
}

type DragHandle =
  | 'tl'
  | 'tr'
  | 'bl'
  | 'br'
  | 't'
  | 'r'
  | 'b'
  | 'l'
  | 'move'
  | null

export const Renderer = observer((props: { className?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPoint, setStartPoint] = useState<Point | null>(null)
  const [currentSelection, setCurrentSelection] =
    useState<SelectionRect | null>(null)
  const [currentStroke, setCurrentStroke] = useState<BrushStroke | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  // Space key temporary drag state
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  const [isSpacePanning, setIsSpacePanning] = useState(false)

  // Crop mode state
  const [cropRect, setCropRect] = useState<SelectionRect | null>(null)
  const [dragHandle, setDragHandle] = useState<DragHandle>(null)
  // Store crop rect position relative to image as ratio (0-1 range), to avoid reset on zoom
  const [cropRectRatio, setCropRectRatio] = useState<SelectionRect | null>(null)

  const [redactPreview, setRedactPreview] = useState<SelectionRect | null>(null)

  const { currentTool, brushSize, brushColor, redactColor, isCropMode, cropAspectRatio, selection } =
    appStateStore.editorStore
  const { imageData, pan, scale } = appStateStore.sceneStore
  const { colorTheme } = appStateStore.settingsStore

  // Draw checkerboard pattern (for displaying transparent areas)
  const drawCheckerboard = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    cellSize: number = 10,
  ) => {
    ctx.save()
    ctx.beginPath()
    ctx.rect(x, y, width, height)
    ctx.clip()

    const startCol = Math.floor(x / cellSize)
    const startRow = Math.floor(y / cellSize)
    const endCol = Math.ceil((x + width) / cellSize)
    const endRow = Math.ceil((y + height) / cellSize)

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        ctx.fillStyle = (row + col) % 2 === 0 ? '#ffffff' : '#cccccc'
        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize)
      }
    }

    ctx.restore()
  }

  // Draw canvas
  const redrawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas (using theme color)
    const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary').trim()
    ctx.fillStyle = bgColor || '#f0f0f0'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw image (considering pan and zoom)
    if (imageData) {
      const imgWidth = imageData.width * scale
      const imgHeight = imageData.height * scale
      const imgX = (canvas.width - imgWidth) / 2 + pan.x
      const imgY = (canvas.height - imgHeight) / 2 + pan.y

      // Draw checkerboard background in image area first (for displaying transparent areas)
      drawCheckerboard(ctx, imgX, imgY, imgWidth, imgHeight)

      // Set high quality image smoothing to avoid aliasing when scaling down
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      ctx.drawImage(imageData, imgX, imgY, imgWidth, imgHeight)

      // Draw current stroke in progress (temporary preview)
      if (currentStroke && currentStroke.points.length > 0) {
        // Clip drawing area to image bounds
        ctx.save()
        ctx.beginPath()
        ctx.rect(imgX, imgY, imgWidth, imgHeight)
        ctx.clip()

        ctx.strokeStyle = currentStroke.color
        ctx.lineWidth = currentStroke.size
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(currentStroke.points[0].x, currentStroke.points[0].y)
        currentStroke.points.forEach((point) => ctx.lineTo(point.x, point.y))
        ctx.stroke()

        ctx.restore()
      }
    }

    // Draw rectangle selection
    if (currentSelection && currentTool === 'marquee') {
      ctx.strokeStyle = '#0066ff'
      ctx.lineWidth = 1
      ctx.setLineDash([5, 5])
      ctx.strokeRect(
        currentSelection.x,
        currentSelection.y,
        currentSelection.width,
        currentSelection.height,
      )
      ctx.setLineDash([])
    }

    // Draw redact preview
    if (redactPreview && currentTool === 'redact') {
      ctx.fillStyle = redactColor
      ctx.fillRect(
        redactPreview.x,
        redactPreview.y,
        redactPreview.width,
        redactPreview.height,
      )
    }

    // Draw crop box
    if (cropRect && isCropMode) {
      // Use path to draw mask, excluding crop area
      // Draw four rectangle areas as mask (parts outside crop box)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'

      // Top area
      ctx.fillRect(0, 0, canvas.width, cropRect.y)
      // Bottom area
      ctx.fillRect(0, cropRect.y + cropRect.height, canvas.width, canvas.height - cropRect.y - cropRect.height)
      // Left area (middle height)
      ctx.fillRect(0, cropRect.y, cropRect.x, cropRect.height)
      // Right area (middle height)
      ctx.fillRect(cropRect.x + cropRect.width, cropRect.y, canvas.width - cropRect.x - cropRect.width, cropRect.height)

      // Draw resize handles
      drawCropHandles(ctx, cropRect)
    }
  }

  // Prevent browser/system zoom gestures
  useEffectOnce(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleNativeWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault()
      }
    }

    canvas.addEventListener('wheel', handleNativeWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleNativeWheel)
  })

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const parent = canvas.parentElement
      if (parent) {
        canvas.width = parent.clientWidth
        canvas.height = parent.clientHeight
        appStateStore.sceneStore.setCanvasSize(canvas.width, canvas.height)
        // Call redrawCanvas directly since it can access the latest state
        requestAnimationFrame(() => {
          redrawCanvas()
        })
      }
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [
    imageData,
    currentSelection,
    currentStroke,
    redactPreview,
    pan,
    scale,
    cropRect,
    isCropMode,
    currentTool,
  ])

  // Initialize crop box when entering crop mode (only on first entry)
  useEffect(() => {
    if (isCropMode && imageData && !cropRectRatio) {
      // Initial crop box covers the entire image (relative ratio is 0-1)
      setCropRectRatio({
        x: 0,
        y: 0,
        width: 1,
        height: 1,
      })
    } else if (!isCropMode) {
      setCropRect(null)
      setCropRectRatio(null)
    }
  }, [isCropMode, imageData])

  // Sync local selection state when store selection is cleared
  useEffect(() => {
    if (selection === null) {
      setCurrentSelection(null)
    }
  }, [selection])

  // Calculate actual crop box based on ratio position and current zoom/pan
  useEffect(() => {
    if (isCropMode && imageData && cropRectRatio) {
      const canvas = canvasRef.current
      if (!canvas) return

      // Calculate image position on canvas (considering pan and zoom)
      const imgWidth = imageData.width * scale
      const imgHeight = imageData.height * scale
      const imgX = (canvas.width - imgWidth) / 2 + pan.x
      const imgY = (canvas.height - imgHeight) / 2 + pan.y

      // Calculate crop box actual position and size based on ratio
      setCropRect({
        x: imgX + cropRectRatio.x * imgWidth,
        y: imgY + cropRectRatio.y * imgHeight,
        width: cropRectRatio.width * imgWidth,
        height: cropRectRatio.height * imgHeight,
      })
    }
  }, [isCropMode, imageData, scale, pan.x, pan.y, cropRectRatio])

  // Update crop box when aspect ratio changes
  useEffect(() => {
    if (isCropMode && cropRect && cropRectRatio && cropAspectRatio !== 'free') {
      const ratio = getAspectRatioValue(cropAspectRatio)
      const newRect = { ...cropRect }

      // Calculate two possible sizes based on width and height
      const widthBasedHeight = newRect.width / ratio
      const heightBasedWidth = newRect.height * ratio

      // Choose the smaller size to ensure crop box doesn't exceed original area
      if (widthBasedHeight <= newRect.height) {
        // Calculate height based on width
        newRect.height = widthBasedHeight
      } else {
        // Calculate width based on height
        newRect.width = heightBasedWidth
      }

      setCropRect(newRect)

      // Update ratio position
      const imgRect = getImageRect()
      if (imgRect) {
        setCropRectRatio({
          x: (newRect.x - imgRect.x) / imgRect.width,
          y: (newRect.y - imgRect.y) / imgRect.height,
          width: newRect.width / imgRect.width,
          height: newRect.height / imgRect.height,
        })
      }
    }
  }, [cropAspectRatio])

  // Listen for crop confirm event
  useEffect(() => {
    const handleCropConfirm = () => {
      if (cropRect) {
        performCrop(cropRect)
      }
    }

    window.addEventListener('crop-confirm', handleCropConfirm)
    return () => window.removeEventListener('crop-confirm', handleCropConfirm)
  }, [cropRect])

  // Listen for space key to enable temporary drag functionality
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent triggering in input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      // Space key pressed
      if (e.code === 'Space' && !isSpacePressed) {
        e.preventDefault()
        setIsSpacePressed(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      // Space key released
      if (e.code === 'Space') {
        e.preventDefault()
        setIsSpacePressed(false)
        setIsSpacePanning(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isSpacePressed])

  // Get image position and size on canvas
  const getImageRect = (): SelectionRect | null => {
    const canvas = canvasRef.current
    if (!canvas || !imageData) return null

    const imgWidth = imageData.width * scale
    const imgHeight = imageData.height * scale
    const imgX = (canvas.width - imgWidth) / 2 + pan.x
    const imgY = (canvas.height - imgHeight) / 2 + pan.y

    return { x: imgX, y: imgY, width: imgWidth, height: imgHeight }
  }

  // Draw crop box resize handles
  const drawCropHandles = (
    ctx: CanvasRenderingContext2D,
    rect: SelectionRect,
  ) => {
    const handleSize = 8
    const handles = [
      { x: rect.x, y: rect.y }, // tl
      { x: rect.x + rect.width, y: rect.y }, // tr
      { x: rect.x, y: rect.y + rect.height }, // bl
      { x: rect.x + rect.width, y: rect.y + rect.height }, // br
      { x: rect.x + rect.width / 2, y: rect.y }, // t
      { x: rect.x + rect.width, y: rect.y + rect.height / 2 }, // r
      { x: rect.x + rect.width / 2, y: rect.y + rect.height }, // b
      { x: rect.x, y: rect.y + rect.height / 2 }, // l
    ]

    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 1

    handles.forEach((handle) => {
      ctx.fillRect(
        handle.x - handleSize / 2,
        handle.y - handleSize / 2,
        handleSize,
        handleSize,
      )
      ctx.strokeRect(
        handle.x - handleSize / 2,
        handle.y - handleSize / 2,
        handleSize,
        handleSize,
      )
    })
  }

  // Detect if click is on crop box handle
  const getHandleAtPoint = (point: Point, rect: SelectionRect): DragHandle => {
    const handleSize = 8
    const threshold = handleSize

    const handles: { type: DragHandle; x: number; y: number }[] = [
      { type: 'tl', x: rect.x, y: rect.y },
      { type: 'tr', x: rect.x + rect.width, y: rect.y },
      { type: 'bl', x: rect.x, y: rect.y + rect.height },
      { type: 'br', x: rect.x + rect.width, y: rect.y + rect.height },
      { type: 't', x: rect.x + rect.width / 2, y: rect.y },
      { type: 'r', x: rect.x + rect.width, y: rect.y + rect.height / 2 },
      { type: 'b', x: rect.x + rect.width / 2, y: rect.y + rect.height },
      { type: 'l', x: rect.x, y: rect.y + rect.height / 2 },
    ]

    for (const handle of handles) {
      const dist = Math.sqrt(
        (point.x - handle.x) ** 2 + (point.y - handle.y) ** 2,
      )
      if (dist < threshold) {
        return handle.type
      }
    }

    // Check if inside crop box (for moving)
    if (
      point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.height
    ) {
      return 'move'
    }

    return null
  }

  // Redraw on every relevant state change
  useEffect(() => {
    redrawCanvas()
  }, [
    imageData,
    currentSelection,
    currentStroke,
    redactPreview,
    pan,
    scale,
    cropRect,
    isCropMode,
    colorTheme,
  ])

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(e)
    setIsDrawing(true)
    setStartPoint(point)

    // Space key temporary drag has highest priority
    if (isSpacePressed) {
      setIsSpacePanning(true)
      return
    }

    // Crop mode
    if (isCropMode && cropRect) {
      const handle = getHandleAtPoint(point, cropRect)
      setDragHandle(handle)
      return
    }

    // Move tool
    if (currentTool === 'move') {
      setIsPanning(true)
      return
    }

    // Brush tool
    if (currentTool === 'brush') {
      setCurrentStroke({
        points: [point],
        color: brushColor,
        size: brushSize,
      })
      return
    }

    // Redact tool
    if (currentTool === 'redact') {
      setRedactPreview({
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
      })
      return
    }

    // Marquee tool
    if (currentTool === 'marquee') {
      setCurrentSelection({
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) return

    const point = getCanvasPoint(e)

    // Space key temporary drag has highest priority
    if (isSpacePanning) {
      const dx = point.x - startPoint.x
      const dy = point.y - startPoint.y
      appStateStore.sceneStore.setPan(pan.x + dx, pan.y + dy)
      setStartPoint(point)
      return
    }

    // Crop mode - adjust crop box
    if (isCropMode && cropRect && dragHandle) {
      const newRect = { ...cropRect }
      const dx = point.x - startPoint.x
      const dy = point.y - startPoint.y

      switch (dragHandle) {
        case 'tl':
          newRect.x += dx
          newRect.y += dy
          newRect.width -= dx
          newRect.height -= dy
          break
        case 'tr':
          newRect.y += dy
          newRect.width += dx
          newRect.height -= dy
          break
        case 'bl':
          newRect.x += dx
          newRect.width -= dx
          newRect.height += dy
          break
        case 'br':
          newRect.width += dx
          newRect.height += dy
          break
        case 't':
          newRect.y += dy
          newRect.height -= dy
          break
        case 'r':
          newRect.width += dx
          break
        case 'b':
          newRect.height += dy
          break
        case 'l':
          newRect.x += dx
          newRect.width -= dx
          break
        case 'move':
          newRect.x += dx
          newRect.y += dy
          break
      }

      // Apply aspect ratio constraint
      if (cropAspectRatio !== 'free') {
        const ratio = getAspectRatioValue(cropAspectRatio)
        if (dragHandle === 'move') {
          // Keep original ratio when moving
        } else {
          // Apply ratio when resizing
          newRect.height = newRect.width / ratio
        }
      }

      // Ensure crop box is not smaller than minimum size
      if (newRect.width > 20 && newRect.height > 20) {
        setCropRect(newRect)
        setStartPoint(point)

        // Update ratio position
        const imgRect = getImageRect()
        if (imgRect) {
          setCropRectRatio({
            x: (newRect.x - imgRect.x) / imgRect.width,
            y: (newRect.y - imgRect.y) / imgRect.height,
            width: newRect.width / imgRect.width,
            height: newRect.height / imgRect.height,
          })
        }
      }
      return
    }

    // Move tool - pan canvas
    if (isPanning) {
      const dx = point.x - startPoint.x
      const dy = point.y - startPoint.y
      appStateStore.sceneStore.setPan(pan.x + dx, pan.y + dy)
      setStartPoint(point)
      return
    }

    // Redact tool
    if (currentTool === 'redact' && redactPreview) {
      setRedactPreview({
        x: Math.min(startPoint.x, point.x),
        y: Math.min(startPoint.y, point.y),
        width: Math.abs(point.x - startPoint.x),
        height: Math.abs(point.y - startPoint.y),
      })
      return
    }

    // Brush tool
    if (currentTool === 'brush' && currentStroke) {
      setCurrentStroke({
        ...currentStroke,
        points: [...currentStroke.points, point],
      })
      return
    }

    // Marquee tool
    if (currentTool === 'marquee') {
      setCurrentSelection({
        x: Math.min(startPoint.x, point.x),
        y: Math.min(startPoint.y, point.y),
        width: Math.abs(point.x - startPoint.x),
        height: Math.abs(point.y - startPoint.y),
      })
    }
  }

  const handleMouseUp = () => {
    if (!isDrawing) return

    // Redact tool - apply filled rectangle to image
    if (currentTool === 'redact' && redactPreview && redactPreview.width > 0 && redactPreview.height > 0) {
      applyRedactToImage(redactPreview)
    }

    // Brush tool - apply stroke to image
    if (
      currentTool === 'brush' &&
      currentStroke &&
      currentStroke.points.length > 0
    ) {
      applyBrushStrokeToImage(currentStroke)
      // Don't clear currentStroke immediately, wait for applyBrushStrokeToImage to complete
    }

    // Marquee tool - convert selection coordinates to image coordinates and store in global store
    if (currentTool === 'marquee' && currentSelection) {
      const imgRect = getImageRect()
      if (imgRect && currentSelection.width > 0 && currentSelection.height > 0) {
        // Convert canvas coordinates to image coordinates
        const imageSelection = {
          x: Math.max(0, (currentSelection.x - imgRect.x) / scale),
          y: Math.max(0, (currentSelection.y - imgRect.y) / scale),
          width: currentSelection.width / scale,
          height: currentSelection.height / scale,
        }
        // Limit selection to not exceed image bounds
        imageSelection.width = Math.min(imageSelection.width, imageData!.width - imageSelection.x)
        imageSelection.height = Math.min(imageSelection.height, imageData!.height - imageSelection.y)

        if (imageSelection.width > 0 && imageSelection.height > 0) {
          appStateStore.editorStore.setSelection(imageSelection)
        }
      }
    }

    setIsDrawing(false)
    setStartPoint(null)
    setIsPanning(false)
    setIsSpacePanning(false)
    setDragHandle(null)
  }

  // Apply brush stroke to image
  const applyBrushStrokeToImage = (stroke: BrushStroke) => {
    const canvas = canvasRef.current
    if (!canvas || !imageData) return

    const imgRect = getImageRect()
    if (!imgRect) return

    // Create temporary canvas to draw stroke onto image
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = imageData.width
    tempCanvas.height = imageData.height
    const tempCtx = tempCanvas.getContext('2d')
    if (!tempCtx) return

    // Draw original image first
    tempCtx.drawImage(imageData, 0, 0)

    // Convert canvas coordinates to image coordinates and draw stroke
    tempCtx.strokeStyle = stroke.color
    tempCtx.lineWidth = stroke.size / scale // Consider zoom ratio
    tempCtx.lineCap = 'round'
    tempCtx.lineJoin = 'round'
    tempCtx.beginPath()

    const firstPoint = stroke.points[0]
    const imgFirstX = (firstPoint.x - imgRect.x) / scale
    const imgFirstY = (firstPoint.y - imgRect.y) / scale
    tempCtx.moveTo(imgFirstX, imgFirstY)

    stroke.points.forEach((point) => {
      const imgX = (point.x - imgRect.x) / scale
      const imgY = (point.y - imgRect.y) / scale
      tempCtx.lineTo(imgX, imgY)
    })
    tempCtx.stroke()

    // Convert result to new ImageBitmap
    tempCanvas.toBlob((blob) => {
      if (blob) {
        createImageBitmap(blob).then((newImageData) => {
          appStateStore.sceneStore.setImageData(newImageData)
          // Clear stroke after image update to avoid flicker
          setCurrentStroke(null)
        })
      }
    })
  }

  // Apply redact rectangle to image
  const applyRedactToImage = (rect: SelectionRect) => {
    const canvas = canvasRef.current
    if (!canvas || !imageData) return

    const imgRect = getImageRect()
    if (!imgRect) return

    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = imageData.width
    tempCanvas.height = imageData.height
    const tempCtx = tempCanvas.getContext('2d')
    if (!tempCtx) return

    tempCtx.drawImage(imageData, 0, 0)

    // Convert canvas coordinates to image coordinates
    const imgX = (rect.x - imgRect.x) / scale
    const imgY = (rect.y - imgRect.y) / scale
    const imgW = rect.width / scale
    const imgH = rect.height / scale

    tempCtx.fillStyle = redactColor
    tempCtx.fillRect(imgX, imgY, imgW, imgH)

    tempCanvas.toBlob((blob) => {
      if (blob) {
        createImageBitmap(blob).then((newImageData) => {
          appStateStore.sceneStore.setImageData(newImageData)
          setRedactPreview(null)
        })
      }
    })
  }

  // Get aspect ratio value
  const getAspectRatioValue = (ratio: typeof cropAspectRatio): number => {
    switch (ratio) {
      case '1:1':
        return 1
      case '16:9':
        return 16 / 9
      case '4:3':
        return 4 / 3
      case '3:2':
        return 3 / 2
      default:
        return 1
    }
  }

  const performCrop = (selection: SelectionRect) => {
    const canvas = canvasRef.current
    if (!canvas || !imageData) return

    // Calculate image position on canvas
    const imgRect = getImageRect()
    if (!imgRect) return

    // Calculate crop area position relative to original image (considering zoom)
    const cropX = (selection.x - imgRect.x) / scale
    const cropY = (selection.y - imgRect.y) / scale
    const cropWidth = selection.width / scale
    const cropHeight = selection.height / scale

    // Create temporary canvas for cropping
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = cropWidth
    tempCanvas.height = cropHeight
    const tempCtx = tempCanvas.getContext('2d')
    if (!tempCtx) return

    // Draw cropped image
    tempCtx.drawImage(
      imageData,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight,
    )

    // Convert crop result to ImageBitmap
    tempCanvas.toBlob((blob) => {
      if (blob) {
        createImageBitmap(blob).then((newImageData) => {
          appStateStore.sceneStore.setImageData(newImageData)
          // Don't reset zoom and pan, keep current view
          appStateStore.editorStore.exitCropMode()
        })
      }
    })
  }

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!imageData) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const delta = e.deltaY > 0 ? 0.95 : 1.05
    const newScale = Math.max(0.1, Math.min(5, scale * delta))
    
    // Get mouse position on canvas
    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    // Calculate current image position and size
    const imgWidth = imageData.width * scale
    const imgHeight = imageData.height * scale
    const imgX = (canvas.width - imgWidth) / 2 + pan.x
    const imgY = (canvas.height - imgHeight) / 2 + pan.y
    
    // Mouse position relative to image (0-1 range)
    const relX = (mouseX - imgX) / imgWidth
    const relY = (mouseY - imgY) / imgHeight
    
    // New image dimensions
    const newImgWidth = imageData.width * newScale
    const newImgHeight = imageData.height * newScale
    
    // Calculate new pan value to keep mouse position unchanged
    // mouseX = newImgX + relX * newImgWidth
    // mouseX = (canvas.width - newImgWidth) / 2 + newPanX + relX * newImgWidth
    const newPanX = mouseX - (canvas.width - newImgWidth) / 2 - relX * newImgWidth
    const newPanY = mouseY - (canvas.height - newImgHeight) / 2 - relY * newImgHeight
    
    appStateStore.sceneStore.setPan(newPanX, newPanY)
    appStateStore.sceneStore.setScale(newScale)
  }

  // Get mouse cursor style
  const getCursorStyle = (): string => {
    // Space key drag mode
    if (isSpacePressed) {
      return isSpacePanning ? 'grabbing' : 'grab'
    }

    if (isCropMode && cropRect) {
      return 'crosshair'
    }
    if (currentTool === 'move') {
      return isPanning ? 'grabbing' : 'grab'
    }
    if (currentTool === 'brush') {
      return 'crosshair'
    }
    if (currentTool === 'marquee') {
      return 'crosshair'
    }
    if (currentTool === 'redact') {
      return 'crosshair'
    }
    return 'default'
  }

  return (
    <div className={props.className + ' relative overflow-hidden'}>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className="h-full w-full"
        style={{ cursor: getCursorStyle() }}
      />
    </div>
  )
})

import { useRef, useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { appStateStore } from '../store'
import { commandRegistry } from '../actions'

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
  // 空格键临时拖拽状态
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  const [isSpacePanning, setIsSpacePanning] = useState(false)

  // 裁剪模式状态
  const [cropRect, setCropRect] = useState<SelectionRect | null>(null)
  const [dragHandle, setDragHandle] = useState<DragHandle>(null)
  // 保存裁剪框相对于图片的比例位置（范围 0-1），避免缩放时重置
  const [cropRectRatio, setCropRectRatio] = useState<SelectionRect | null>(null)

  const { currentTool, brushSize, brushColor, isCropMode, cropAspectRatio } =
    appStateStore.editorStore
  const { imageData, pan, scale } = appStateStore.sceneStore

  // 绘制画布
  const redrawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 清空画布
    ctx.fillStyle = '#f0f0f0'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 绘制图片（考虑平移和缩放）
    if (imageData) {
      const imgWidth = imageData.width * scale
      const imgHeight = imageData.height * scale
      const imgX = (canvas.width - imgWidth) / 2 + pan.x
      const imgY = (canvas.height - imgHeight) / 2 + pan.y

      ctx.drawImage(imageData, imgX, imgY, imgWidth, imgHeight)

      // 绘制当前正在进行的笔触（临时预览）
      if (currentStroke && currentStroke.points.length > 0) {
        // 裁剪绘制区域到图像范围内
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

    // 绘制矩形选框
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

    // 绘制裁剪框
    if (cropRect && isCropMode) {
      // 半透明遮罩
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 清除裁剪区域，显示原图
      ctx.clearRect(cropRect.x, cropRect.y, cropRect.width, cropRect.height)
      if (imageData) {
        const imgWidth = imageData.width * scale
        const imgHeight = imageData.height * scale
        const imgX = (canvas.width - imgWidth) / 2 + pan.x
        const imgY = (canvas.height - imgHeight) / 2 + pan.y
        ctx.drawImage(imageData, imgX, imgY, imgWidth, imgHeight)
      }

      // 裁剪框边框
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.setLineDash([])
      ctx.strokeRect(cropRect.x, cropRect.y, cropRect.width, cropRect.height)

      // 绘制调整手柄
      drawCropHandles(ctx, cropRect)
    }
  }

  // 初始化画布
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const parent = canvas.parentElement
      if (parent) {
        canvas.width = parent.clientWidth
        canvas.height = parent.clientHeight
        appStateStore.sceneStore.setCanvasSize(canvas.width, canvas.height)
        // 直接调用 redrawCanvas，因为它现在可以访问最新的状态
        requestAnimationFrame(() => {
          redrawCanvas()
        })
      }
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [imageData, currentSelection, currentStroke, pan, scale, cropRect, isCropMode, currentTool])

  // 进入裁剪模式时，初始化裁剪框（只在首次进入时）
  useEffect(() => {
    if (isCropMode && imageData && !cropRectRatio) {
      // 初始裁剪框为整个图片（相对比例都是 0-1）
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

  // 根据比例位置和当前缩放/平移计算实际裁剪框
  useEffect(() => {
    if (isCropMode && imageData && cropRectRatio) {
      const canvas = canvasRef.current
      if (!canvas) return

      // 计算图片在画布上的位置（考虑平移和缩放）
      const imgWidth = imageData.width * scale
      const imgHeight = imageData.height * scale
      const imgX = (canvas.width - imgWidth) / 2 + pan.x
      const imgY = (canvas.height - imgHeight) / 2 + pan.y

      // 根据比例计算裁剪框的实际位置和大小
      setCropRect({
        x: imgX + cropRectRatio.x * imgWidth,
        y: imgY + cropRectRatio.y * imgHeight,
        width: cropRectRatio.width * imgWidth,
        height: cropRectRatio.height * imgHeight,
      })
    }
  }, [isCropMode, imageData, scale, pan.x, pan.y, cropRectRatio])

  // 裁剪比例变化时，更新裁剪框
  useEffect(() => {
    if (isCropMode && cropRect && cropRectRatio && cropAspectRatio !== 'free') {
      const ratio = getAspectRatioValue(cropAspectRatio)
      const newRect = { ...cropRect }
      // 基于当前宽度计算新高度
      newRect.height = newRect.width / ratio
      setCropRect(newRect)

      // 更新比例位置
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

  // 监听裁剪确认事件
  useEffect(() => {
    const handleCropConfirm = () => {
      if (cropRect) {
        performCrop(cropRect)
      }
    }

    window.addEventListener('crop-confirm', handleCropConfirm)
    return () => window.removeEventListener('crop-confirm', handleCropConfirm)
  }, [cropRect])

  // 监听空格键实现临时拖拽功能
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 防止在输入框中触发
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      // 按下空格键
      if (e.code === 'Space' && !isSpacePressed) {
        e.preventDefault()
        setIsSpacePressed(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      // 松开空格键
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

  // 获取图片在画布上的位置和尺寸
  const getImageRect = (): SelectionRect | null => {
    const canvas = canvasRef.current
    if (!canvas || !imageData) return null

    const imgWidth = imageData.width * scale
    const imgHeight = imageData.height * scale
    const imgX = (canvas.width - imgWidth) / 2 + pan.x
    const imgY = (canvas.height - imgHeight) / 2 + pan.y

    return { x: imgX, y: imgY, width: imgWidth, height: imgHeight }
  }

  // 绘制裁剪框调整手柄
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

  // 检测是否点击在裁剪框手柄上
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

    // 检测是否在裁剪框内部（用于移动）
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

  // 每次相关状态变化时重绘
  useEffect(() => {
    redrawCanvas()
  }, [
    imageData,
    currentSelection,
    currentStroke,
    pan,
    scale,
    cropRect,
    isCropMode,
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

    // 空格键临时拖拽优先级最高
    if (isSpacePressed) {
      setIsSpacePanning(true)
      return
    }

    // 裁剪模式
    if (isCropMode && cropRect) {
      const handle = getHandleAtPoint(point, cropRect)
      setDragHandle(handle)
      return
    }

    // 移动工具
    if (currentTool === 'move') {
      setIsPanning(true)
      return
    }

    // 画笔工具
    if (currentTool === 'brush') {
      setCurrentStroke({
        points: [point],
        color: brushColor,
        size: brushSize,
      })
      return
    }

    // 矩形选框工具
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

    // 空格键临时拖拽优先级最高
    if (isSpacePanning) {
      const dx = point.x - startPoint.x
      const dy = point.y - startPoint.y
      appStateStore.sceneStore.setPan(pan.x + dx, pan.y + dy)
      setStartPoint(point)
      return
    }

    // 裁剪模式 - 调整裁剪框
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

      // 应用纵横比约束
      if (cropAspectRatio !== 'free') {
        const ratio = getAspectRatioValue(cropAspectRatio)
        if (dragHandle === 'move') {
          // 移动时保持原比例
        } else {
          // 调整大小时应用比例
          newRect.height = newRect.width / ratio
        }
      }

      // 确保裁剪框不小于最小尺寸
      if (newRect.width > 20 && newRect.height > 20) {
        setCropRect(newRect)
        setStartPoint(point)

        // 更新比例位置
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

    // 移动工具 - 平移画布
    if (isPanning) {
      const dx = point.x - startPoint.x
      const dy = point.y - startPoint.y
      appStateStore.sceneStore.setPan(pan.x + dx, pan.y + dy)
      setStartPoint(point)
      return
    }

    // 画笔工具
    if (currentTool === 'brush' && currentStroke) {
      setCurrentStroke({
        ...currentStroke,
        points: [...currentStroke.points, point],
      })
      return
    }

    // 矩形选框工具
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

    // 画笔工具 - 将笔触应用到图像上
    if (
      currentTool === 'brush' &&
      currentStroke &&
      currentStroke.points.length > 0
    ) {
      applyBrushStrokeToImage(currentStroke)
      // 不立即清空 currentStroke，等待 applyBrushStrokeToImage 完成后再清空
    }

    setIsDrawing(false)
    setStartPoint(null)
    setIsPanning(false)
    setIsSpacePanning(false)
    setDragHandle(null)
  }

  // 将画笔笔触应用到图像上
  const applyBrushStrokeToImage = (stroke: BrushStroke) => {
    const canvas = canvasRef.current
    if (!canvas || !imageData) return

    const imgRect = getImageRect()
    if (!imgRect) return

    // 创建临时画布，将笔触绘制到图像上
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = imageData.width
    tempCanvas.height = imageData.height
    const tempCtx = tempCanvas.getContext('2d')
    if (!tempCtx) return

    // 先绘制原图
    tempCtx.drawImage(imageData, 0, 0)

    // 将画布坐标转换为图像坐标并绘制笔触
    tempCtx.strokeStyle = stroke.color
    tempCtx.lineWidth = stroke.size / scale // 考虑缩放比例
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

    // 将结果转换为新的 ImageBitmap
    tempCanvas.toBlob((blob) => {
      if (blob) {
        createImageBitmap(blob).then((newImageData) => {
          appStateStore.sceneStore.setImageData(newImageData)
          // 图像更新完成后清空笔触，避免闪烁
          setCurrentStroke(null)
        })
      }
    })
  }

  // 获取纵横比数值
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

    // 计算图片在画布上的位置
    const imgRect = getImageRect()
    if (!imgRect) return

    // 计算裁剪区域相对于原图的位置（考虑缩放）
    const cropX = (selection.x - imgRect.x) / scale
    const cropY = (selection.y - imgRect.y) / scale
    const cropWidth = selection.width / scale
    const cropHeight = selection.height / scale

    // 创建临时画布进行裁剪
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = cropWidth
    tempCanvas.height = cropHeight
    const tempCtx = tempCanvas.getContext('2d')
    if (!tempCtx) return

    // 绘制裁剪后的图片
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

    // 将裁剪结果转换为 ImageBitmap
    tempCanvas.toBlob((blob) => {
      if (blob) {
        createImageBitmap(blob).then((newImageData) => {
          appStateStore.sceneStore.setImageData(newImageData)
          // 不重置缩放和平移，保持当前视图
          appStateStore.editorStore.exitCropMode()
        })
      }
    })
  }

  // 鼠标滚轮缩放
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.max(0.1, Math.min(5, scale * delta))
    appStateStore.sceneStore.setScale(newScale)
  }

  // 获取鼠标指针样式
  const getCursorStyle = (): string => {
    // 空格键拖拽模式
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
    return 'default'
  }

  return (
    <div className={props.className + ' relative overflow-hidden'}>
      {!imageData && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <button
              onClick={() => commandRegistry.executeCommand('file.open')}
              className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 bg-white px-6 py-8 hover:border-gray-400"
            >
              <p className="text-gray-600">点击上传图片</p>
              <p className="mt-2 text-sm text-gray-400">
                支持 JPG, PNG, GIF 格式
              </p>
            </button>
          </div>
        </div>
      )}
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

import { makeAutoObservable } from 'mobx'

export type ToolType = 'move' | 'marquee' | 'crop' | 'brush'
export type CropAspectRatio = 'free' | '1:1' | '16:9' | '4:3' | '3:2'

class AppToolbarStore {
  constructor() {
    makeAutoObservable(this)
  }
}

class EditorStore {
  currentTool: ToolType = 'move'
  brushSize = 5
  brushColor = '#000000'

  // 裁剪模式相关状态
  isCropMode = false
  cropAspectRatio: CropAspectRatio = 'free'

  constructor() {
    makeAutoObservable(this)
  }

  setTool(tool: ToolType) {
    this.currentTool = tool
    if (tool === 'crop') {
      this.isCropMode = true
    } else {
      this.isCropMode = false
    }
  }

  setBrushSize(size: number) {
    this.brushSize = size
  }

  setBrushColor(color: string) {
    this.brushColor = color
  }

  setCropAspectRatio(ratio: CropAspectRatio) {
    this.cropAspectRatio = ratio
  }

  exitCropMode() {
    this.isCropMode = false
    this.currentTool = 'move'
  }
}

// 历史记录条目
interface HistoryEntry {
  imageData: ImageBitmap
  timestamp: number
}

class HistoryStore {
  private history: HistoryEntry[] = []
  private currentIndex = -1
  private maxHistorySize = 50

  constructor() {
    makeAutoObservable(this)
  }

  // 添加新的历史记录
  pushState(imageData: ImageBitmap) {
    // 移除当前位置之后的所有历史
    this.history = this.history.slice(0, this.currentIndex + 1)

    // 添加新状态
    this.history.push({
      imageData,
      timestamp: Date.now(),
    })

    // 限制历史记录大小
    if (this.history.length > this.maxHistorySize) {
      this.history.shift()
    } else {
      this.currentIndex++
    }
  }

  // 撤销
  undo(): ImageBitmap | null {
    if (!this.canUndo) return null
    this.currentIndex--
    return this.history[this.currentIndex].imageData
  }

  // 重做
  redo(): ImageBitmap | null {
    if (!this.canRedo) return null
    this.currentIndex++
    return this.history[this.currentIndex].imageData
  }

  // 清空历史
  clear() {
    this.history = []
    this.currentIndex = -1
  }

  // 是否可以撤销
  get canUndo(): boolean {
    return this.currentIndex > 0
  }

  // 是否可以重做
  get canRedo(): boolean {
    return this.currentIndex < this.history.length - 1
  }

  // 获取当前状态
  get currentState(): ImageBitmap | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
      return this.history[this.currentIndex].imageData
    }
    return null
  }
}

class SceneStore {
  imageData: ImageBitmap | null = null
  originalFileName: string = 'image' // 原始文件名（不含扩展名）
  canvasWidth = 0
  canvasHeight = 0
  // 视图状态
  pan = { x: 0, y: 0 }
  scale = 1

  constructor() {
    makeAutoObservable(this)
  }

  setImageData(imageData: ImageBitmap | null, addToHistory = true) {
    this.imageData = imageData
    if (imageData) {
      // 添加到历史记录
      if (addToHistory) {
        appStateStore.historyStore.pushState(imageData)
      }
    }
  }

  setOriginalFileName(fileName: string) {
    // 移除扩展名
    this.originalFileName = fileName.replace(/\.[^/.]+$/, '')
  }

  setCanvasSize(width: number, height: number) {
    this.canvasWidth = width
    this.canvasHeight = height
  }

  setPan(x: number, y: number) {
    this.pan = { x, y }
  }

  setScale(scale: number) {
    this.scale = scale
  }

  // 计算适配屏幕的缩放比例
  calculateFitScale(imgWidth: number, imgHeight: number): number {
    if (this.canvasWidth === 0 || this.canvasHeight === 0) {
      return 1
    }
    const padding = 40 // 留边距
    const scaleX = (this.canvasWidth - padding * 2) / imgWidth
    const scaleY = (this.canvasHeight - padding * 2) / imgHeight
    return Math.min(scaleX, scaleY, 1) // 不超过 100%
  }

  // 重置视图
  resetView() {
    this.pan = { x: 0, y: 0 }
    this.scale = 1
  }
}

export interface QuickPickItem<T = any> {
  label: string
  description?: string
  detail?: string
  value?: T
}

export interface InputBoxOptions {
  title?: string
  placeholder?: string
  prompt?: string
  value?: string
  validateInput?: (value: string) => string | null | undefined
}

type QuickPickType = 'quickpick' | 'inputbox'

interface QuickPickState<T = any> {
  type: QuickPickType
  // QuickPick options
  items?: QuickPickItem<T>[]
  title?: string
  placeholder?: string
  // InputBox options
  inputBoxOptions?: InputBoxOptions
  // Promise resolvers
  resolve?: (value: any) => void
  reject?: (reason?: any) => void
}

class QuickPickStore {
  private state: QuickPickState | null = null

  constructor() {
    makeAutoObservable(this)
  }

  get isOpen() {
    return this.state !== null
  }

  get currentState() {
    return this.state
  }

  showQuickPick<T = any>(
    items: QuickPickItem<T>[],
    options?: { title?: string; placeholder?: string }
  ): Promise<QuickPickItem<T> | undefined> {
    return new Promise((resolve, reject) => {
      this.state = {
        type: 'quickpick',
        items,
        title: options?.title,
        placeholder: options?.placeholder,
        resolve,
        reject,
      }
    })
  }

  showInputBox(options?: InputBoxOptions): Promise<string | undefined> {
    return new Promise((resolve, reject) => {
      this.state = {
        type: 'inputbox',
        inputBoxOptions: options,
        resolve,
        reject,
      }
    })
  }

  accept(value: any) {
    if (this.state?.resolve) {
      this.state.resolve(value)
      this.state = null
    }
  }

  cancel() {
    if (this.state?.resolve) {
      this.state.resolve(undefined)
      this.state = null
    }
  }

  dispose() {
    if (this.state?.reject) {
      this.state.reject(new Error('QuickPick disposed'))
    }
    this.state = null
  }
}

class ExportDialogStore {
  isOpen = false

  constructor() {
    makeAutoObservable(this)
  }

  open() {
    this.isOpen = true
  }

  close() {
    this.isOpen = false
  }
}

export interface ProgressOptions {
  title: string
  cancellable?: boolean
}

interface ProgressState {
  title: string
  message?: string
  percentage?: number
  cancellable: boolean
  onCancel?: () => void
}

class ProgressStore {
  private state: ProgressState | null = null

  constructor() {
    makeAutoObservable(this)
  }

  get isOpen() {
    return this.state !== null
  }

  get currentState() {
    return this.state
  }

  async withProgress<T>(
    options: ProgressOptions,
    task: (progress: {
      report: (value: { message?: string; percentage?: number }) => void
    }) => Promise<T>
  ): Promise<T> {
    this.state = {
      title: options.title,
      cancellable: options.cancellable ?? false,
    }

    let cancelled = false
    const onCancel = () => {
      cancelled = true
    }

    if (options.cancellable) {
      this.state.onCancel = onCancel
    }

    try {
      const result = await task({
        report: (value) => {
          if (cancelled) {
            throw new Error('Operation cancelled')
          }
          if (this.state) {
            this.state = {
              ...this.state,
              message: value.message,
              percentage: value.percentage,
            }
          }
        },
      })
      return result
    } finally {
      this.state = null
    }
  }

  cancel() {
    if (this.state?.onCancel) {
      this.state.onCancel()
    }
  }
}

class AppStateStore {
  readonly toolbarStore = new AppToolbarStore()
  readonly sceneStore = new SceneStore()
  readonly editorStore = new EditorStore()
  readonly historyStore = new HistoryStore()
  readonly quickPickStore = new QuickPickStore()
  readonly exportDialogStore = new ExportDialogStore()
  readonly progressStore = new ProgressStore()

  constructor() {
    makeAutoObservable(this)
  }

  // 撤销
  undo() {
    const imageData = this.historyStore.undo()
    if (imageData) {
      this.sceneStore.setImageData(imageData, false)
    }
  }

  // 重做
  redo() {
    const imageData = this.historyStore.redo()
    if (imageData) {
      this.sceneStore.setImageData(imageData, false)
    }
  }
}

export const appStateStore = new AppStateStore()

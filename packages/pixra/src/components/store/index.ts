import { makeAutoObservable } from 'mobx'
import { DocumentStore } from './DocumentStore'

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

class SceneStore {
  // 画布尺寸保持为全局属性（UI 层面）
  canvasWidth = 0
  canvasHeight = 0
  #documentStore: DocumentStore

  constructor(documentStore: DocumentStore) {
    this.#documentStore = documentStore
    makeAutoObservable(this)
  }

  // 代理到当前活动文档
  get imageData(): ImageBitmap | null {
    return this.#documentStore.activeDocument?.imageData ?? null
  }

  get originalFileName(): string {
    return this.#documentStore.activeDocument?.name ?? 'image'
  }

  get pan(): { x: number; y: number } {
    return this.#documentStore.activeDocument?.viewState.pan ?? { x: 0, y: 0 }
  }

  get scale(): number {
    return this.#documentStore.activeDocument?.viewState.scale ?? 1
  }

  setImageData(imageData: ImageBitmap | null, addToHistory = true) {
    this.#documentStore.setImageData(imageData, addToHistory)
  }

  setOriginalFileName(fileName: string) {
    // 移除扩展名并设置文档名称
    const name = fileName.replace(/\.[^/.]+$/, '')
    this.#documentStore.setDocumentName(name)
  }

  setCanvasSize(width: number, height: number) {
    this.canvasWidth = width
    this.canvasHeight = height
  }

  setPan(x: number, y: number) {
    this.#documentStore.setPan(x, y)
  }

  setScale(scale: number) {
    this.#documentStore.setScale(scale)
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
    this.#documentStore.resetView()
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
    options?: { title?: string; placeholder?: string },
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
    }) => Promise<T>,
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
  readonly documentStore = new DocumentStore()
  readonly sceneStore: SceneStore
  readonly editorStore = new EditorStore()
  readonly quickPickStore = new QuickPickStore()
  readonly exportDialogStore = new ExportDialogStore()
  readonly progressStore = new ProgressStore()

  constructor() {
    this.sceneStore = new SceneStore(this.documentStore)
    makeAutoObservable(this)
  }
}

export const appStateStore = new AppStateStore()

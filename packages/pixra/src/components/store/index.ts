import { makeAutoObservable } from 'mobx'
import { TabStore } from './TabStore'

export type ToolType = 'move' | 'marquee' | 'crop' | 'brush'
export type CropAspectRatio = 'free' | '1:1' | '16:9' | '4:3' | '3:2'

class AppToolbarStore {
  constructor() {
    makeAutoObservable(this)
  }
}

export type ColorTheme = 'system' | 'light' | 'dark'

class SettingsStore {
  colorTheme: ColorTheme = 'system'
  #mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

  constructor() {
    makeAutoObservable(this)
    // 从 localStorage 读取保存的设置
    const saved = localStorage.getItem('pixra-color-theme') as ColorTheme | null
    if (saved !== null) {
      this.colorTheme = saved
    }
    // 监听系统主题变化
    this.#mediaQuery.addEventListener('change', () => this.applyTheme())
    // 初始化时应用主题
    this.applyTheme()
  }

  toggle(theme: ColorTheme) {
    this.colorTheme = theme
    localStorage.setItem('pixra-color-theme', theme)
    this.applyTheme()
  }

  private applyTheme() {
    const isDark =
      this.colorTheme === 'dark' ||
      (this.colorTheme === 'system' && this.#mediaQuery.matches)

    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
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
  #tabStore: TabStore

  constructor(tabStore: TabStore) {
    this.#tabStore = tabStore
    makeAutoObservable(this)
  }

  // 代理到当前活动标签页
  get imageData(): ImageBitmap | null {
    return this.#tabStore.activeTab?.imageData ?? null
  }

  get originalFileName(): string {
    return this.#tabStore.activeTab?.name ?? 'image'
  }

  get pan(): { x: number; y: number } {
    return this.#tabStore.activeTab?.viewState.pan ?? { x: 0, y: 0 }
  }

  get scale(): number {
    return this.#tabStore.activeTab?.viewState.scale ?? 1
  }

  setImageData(imageData: ImageBitmap | null, addToHistory = true) {
    this.#tabStore.setImageData(imageData, addToHistory)
  }

  setOriginalFileName(fileName: string) {
    // 移除扩展名并设置标签页名称
    const name = fileName.replace(/\.[^/.]+$/, '')
    this.#tabStore.setTabName(name)
  }

  setCanvasSize(width: number, height: number) {
    this.canvasWidth = width
    this.canvasHeight = height
  }

  setPan(x: number, y: number) {
    this.#tabStore.setPan(x, y)
  }

  setScale(scale: number) {
    this.#tabStore.setScale(scale)
  }

  // 计算适配屏幕的缩放比例
  calculateFitScale(imgWidth: number, imgHeight: number): number {
    // 如果 canvas 尺寸还没设置，使用窗口尺寸作为回退
    const canvasWidth = this.canvasWidth || window.innerWidth
    const canvasHeight = this.canvasHeight || (window.innerHeight - 120)

    const padding = 40 // 留边距
    const scaleX = (canvasWidth - padding * 2) / imgWidth
    const scaleY = (canvasHeight - padding * 2) / imgHeight
    return Math.min(scaleX, scaleY, 1) // 不超过 100%
  }

  // 重置视图
  resetView() {
    this.#tabStore.resetView()
  }
}

class AppStateStore {
  readonly toolbarStore = new AppToolbarStore()
  readonly tabStore = new TabStore()
  readonly sceneStore: SceneStore
  readonly editorStore = new EditorStore()
  readonly settingsStore = new SettingsStore()

  constructor() {
    this.sceneStore = new SceneStore(this.tabStore)
    makeAutoObservable(this)
  }
}

export const appStateStore = new AppStateStore()

import { makeAutoObservable } from 'mobx'
import { TabStore } from './TabStore'

export type ToolType = 'move' | 'marquee' | 'crop' | 'brush' | 'redact'
export type CropAspectRatio = 'free' | '1:1' | '16:9' | '4:3' | '3:2'

export interface SelectionRect {
  x: number
  y: number
  width: number
  height: number
}

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
    const saved = localStorage.getItem('pixra-color-theme') as ColorTheme | null
    if (saved !== null) {
      this.colorTheme = saved
    }
    this.#mediaQuery.addEventListener('change', () => this.applyTheme())
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
  redactColor = '#000000'

  isCropMode = false
  cropAspectRatio: CropAspectRatio = 'free'

  selection: SelectionRect | null = null

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
    if (tool !== 'marquee') {
      this.selection = null
    }
  }

  setBrushSize(size: number) {
    this.brushSize = size
  }

  setBrushColor(color: string) {
    this.brushColor = color
  }

  setRedactColor(color: string) {
    this.redactColor = color
  }

  setCropAspectRatio(ratio: CropAspectRatio) {
    this.cropAspectRatio = ratio
  }

  exitCropMode() {
    this.isCropMode = false
    this.currentTool = 'move'
  }

  setSelection(selection: SelectionRect | null) {
    this.selection = selection
  }

  clearSelection() {
    this.selection = null
  }
}

class SceneStore {
  canvasWidth = 0
  canvasHeight = 0
  #tabStore: TabStore

  constructor(tabStore: TabStore) {
    this.#tabStore = tabStore
    makeAutoObservable(this)
  }

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

  setImageData(imageData: ImageBitmap, addToHistory = true) {
    this.#tabStore.setImageData(imageData, addToHistory)
  }

  setOriginalFileName(fileName: string) {
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

  calculateFitScale(imgWidth: number, imgHeight: number): number {
    const canvasWidth = this.canvasWidth || window.innerWidth
    const canvasHeight = this.canvasHeight || (window.innerHeight - 120)

    const padding = 40
    const scaleX = (canvasWidth - padding * 2) / imgWidth
    const scaleY = (canvasHeight - padding * 2) / imgHeight
    return Math.min(scaleX, scaleY, 1)
  }

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

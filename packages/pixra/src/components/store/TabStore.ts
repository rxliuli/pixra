import { makeAutoObservable } from 'mobx'

export interface HistoryEntry {
  imageData: ImageBitmap
  timestamp: number
}

export interface EditorTab {
  id: string
  name: string
  filePath?: string
  isDirty: boolean
  imageData: ImageBitmap
  history: HistoryEntry[]
  historyIndex: number
  viewState: {
    pan: { x: number; y: number }
    scale: number
  }
}

function generateId(): string {
  return crypto.randomUUID()
}

export class TabStore {
  tabs: Map<string, EditorTab> = new Map()
  activeTabId: string | null = null
  private maxHistorySize = 50

  constructor() {
    makeAutoObservable(this)
  }

  get activeTab(): EditorTab | null {
    if (!this.activeTabId) return null
    return this.tabs.get(this.activeTabId) ?? null
  }

  get tabList(): EditorTab[] {
    return Array.from(this.tabs.values())
  }

  get hasTabs(): boolean {
    return this.tabs.size > 0
  }

  get canUndo(): boolean {
    const tab = this.activeTab
    return tab ? tab.historyIndex > 0 : false
  }

  get canRedo(): boolean {
    const tab = this.activeTab
    return tab ? tab.historyIndex < tab.history.length - 1 : false
  }

  createTab(imageData: ImageBitmap, name?: string, activate = true): string {
    const id = generateId()
    const tab: EditorTab = {
      id,
      name: name || 'Untitled',
      isDirty: false,
      imageData: imageData,
      history: [],
      historyIndex: -1,
      viewState: {
        pan: { x: 0, y: 0 },
        scale: 1,
      },
    }

    if (imageData) {
      tab.history.push({ imageData, timestamp: Date.now() })
      tab.historyIndex = 0
    }

    this.tabs.set(id, tab)
    if (activate) {
      this.activeTabId = id
    }
    return id
  }

  setTabViewState(
    tabId: string,
    viewState: Partial<EditorTab['viewState']>,
  ): void {
    const tab = this.tabs.get(tabId)
    if (!tab) return
    if (viewState.pan !== undefined) {
      tab.viewState.pan = viewState.pan
    }
    if (viewState.scale !== undefined) {
      tab.viewState.scale = viewState.scale
    }
  }

  closeTab(id: string): void {
    const tab = this.tabs.get(id)
    if (!tab) return

    tab.history = []
    this.tabs.delete(id)

    if (this.activeTabId === id) {
      const remaining = Array.from(this.tabs.keys())
      this.activeTabId =
        remaining.length > 0 ? remaining[remaining.length - 1] : null
    }
  }

  closeAllTabs(): void {
    for (const tab of this.tabs.values()) {
      tab.history = []
    }
    this.tabs.clear()
    this.activeTabId = null
  }

  switchTab(id: string): void {
    if (!this.tabs.has(id)) return
    if (this.activeTabId === id) return
    this.activeTabId = id
  }

  setImageData(imageData: ImageBitmap, addToHistory = true): void {
    const tab = this.activeTab
    if (!tab) return

    tab.imageData = imageData

    if (imageData && addToHistory) {
      this.pushHistory(imageData)
    }
  }

  pushHistory(imageData: ImageBitmap): void {
    const tab = this.activeTab
    if (!tab) return

    // Remove all history after current position
    tab.history = tab.history.slice(0, tab.historyIndex + 1)

    tab.history.push({ imageData, timestamp: Date.now() })

    // Limit history size
    if (tab.history.length > this.maxHistorySize) {
      tab.history.shift()
    } else {
      tab.historyIndex++
    }

    tab.isDirty = true
  }

  undo(): ImageBitmap | null {
    const tab = this.activeTab
    if (!tab || !this.canUndo) return null

    tab.historyIndex--
    tab.imageData = tab.history[tab.historyIndex].imageData
    tab.isDirty = true
    return tab.imageData
  }

  redo(): ImageBitmap | null {
    const tab = this.activeTab
    if (!tab || !this.canRedo) return null

    tab.historyIndex++
    tab.imageData = tab.history[tab.historyIndex].imageData
    tab.isDirty = true
    return tab.imageData
  }

  setPan(x: number, y: number): void {
    const tab = this.activeTab
    if (!tab) return
    tab.viewState.pan = { x, y }
  }

  setScale(scale: number): void {
    const tab = this.activeTab
    if (!tab) return
    tab.viewState.scale = scale
  }

  resetView(): void {
    const tab = this.activeTab
    if (!tab) return
    tab.viewState.pan = { x: 0, y: 0 }
    tab.viewState.scale = 1
  }

  markDirty(): void {
    const tab = this.activeTab
    if (tab) {
      tab.isDirty = true
    }
  }

  markClean(): void {
    const tab = this.activeTab
    if (tab) {
      tab.isDirty = false
    }
  }

  setTabName(name: string): void {
    const tab = this.activeTab
    if (tab) {
      tab.name = name
    }
  }
}

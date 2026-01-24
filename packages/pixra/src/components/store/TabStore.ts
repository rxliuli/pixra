import { makeAutoObservable } from 'mobx'

// 历史记录条目
export interface HistoryEntry {
  imageData: ImageBitmap
  timestamp: number
}

// 编辑器标签页接口
export interface EditorTab {
  id: string
  name: string
  filePath?: string
  isDirty: boolean
  imageData: ImageBitmap | null
  history: HistoryEntry[]
  historyIndex: number
  viewState: {
    pan: { x: number; y: number }
    scale: number
  }
}

// 生成唯一 ID
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

  // 获取当前活动标签页
  get activeTab(): EditorTab | null {
    if (!this.activeTabId) return null
    return this.tabs.get(this.activeTabId) ?? null
  }

  // 获取标签页列表
  get tabList(): EditorTab[] {
    return Array.from(this.tabs.values())
  }

  // 是否有标签页
  get hasTabs(): boolean {
    return this.tabs.size > 0
  }

  // 是否可以撤销
  get canUndo(): boolean {
    const tab = this.activeTab
    return tab ? tab.historyIndex > 0 : false
  }

  // 是否可以重做
  get canRedo(): boolean {
    const tab = this.activeTab
    return tab ? tab.historyIndex < tab.history.length - 1 : false
  }

  // 创建标签页
  createTab(imageData?: ImageBitmap | null, name?: string): string {
    const id = generateId()
    const tab: EditorTab = {
      id,
      name: name || 'Untitled',
      isDirty: false,
      imageData: imageData ?? null,
      history: [],
      historyIndex: -1,
      viewState: {
        pan: { x: 0, y: 0 },
        scale: 1,
      },
    }

    // 如果有初始图像，添加到历史
    if (imageData) {
      tab.history.push({ imageData, timestamp: Date.now() })
      tab.historyIndex = 0
    }

    this.tabs.set(id, tab)
    this.activeTabId = id
    return id
  }

  // 关闭标签页
  closeTab(id: string): void {
    const tab = this.tabs.get(id)
    if (!tab) return

    // 清理历史记录释放内存
    tab.history = []
    this.tabs.delete(id)

    // 如果关闭的是当前标签页，切换到另一个
    if (this.activeTabId === id) {
      const remaining = Array.from(this.tabs.keys())
      this.activeTabId = remaining.length > 0 ? remaining[remaining.length - 1] : null
    }
  }

  // 关闭所有标签页
  closeAllTabs(): void {
    for (const tab of this.tabs.values()) {
      tab.history = []
    }
    this.tabs.clear()
    this.activeTabId = null
  }

  // 切换标签页
  switchTab(id: string): void {
    if (!this.tabs.has(id)) return
    if (this.activeTabId === id) return
    this.activeTabId = id
  }

  // 设置图像数据
  setImageData(imageData: ImageBitmap | null, addToHistory = true): void {
    const tab = this.activeTab
    if (!tab) return

    tab.imageData = imageData

    if (imageData && addToHistory) {
      this.pushHistory(imageData)
    }
  }

  // 添加历史记录
  pushHistory(imageData: ImageBitmap): void {
    const tab = this.activeTab
    if (!tab) return

    // 移除当前位置之后的所有历史
    tab.history = tab.history.slice(0, tab.historyIndex + 1)

    // 添加新状态
    tab.history.push({ imageData, timestamp: Date.now() })

    // 限制历史记录大小
    if (tab.history.length > this.maxHistorySize) {
      tab.history.shift()
    } else {
      tab.historyIndex++
    }

    tab.isDirty = true
  }

  // 撤销
  undo(): ImageBitmap | null {
    const tab = this.activeTab
    if (!tab || !this.canUndo) return null

    tab.historyIndex--
    tab.imageData = tab.history[tab.historyIndex].imageData
    tab.isDirty = true
    return tab.imageData
  }

  // 重做
  redo(): ImageBitmap | null {
    const tab = this.activeTab
    if (!tab || !this.canRedo) return null

    tab.historyIndex++
    tab.imageData = tab.history[tab.historyIndex].imageData
    tab.isDirty = true
    return tab.imageData
  }

  // 设置平移
  setPan(x: number, y: number): void {
    const tab = this.activeTab
    if (!tab) return
    tab.viewState.pan = { x, y }
  }

  // 设置缩放
  setScale(scale: number): void {
    const tab = this.activeTab
    if (!tab) return
    tab.viewState.scale = scale
  }

  // 重置视图
  resetView(): void {
    const tab = this.activeTab
    if (!tab) return
    tab.viewState.pan = { x: 0, y: 0 }
    tab.viewState.scale = 1
  }

  // 标记为脏
  markDirty(): void {
    const tab = this.activeTab
    if (tab) {
      tab.isDirty = true
    }
  }

  // 标记为干净
  markClean(): void {
    const tab = this.activeTab
    if (tab) {
      tab.isDirty = false
    }
  }

  // 设置标签页名称
  setTabName(name: string): void {
    const tab = this.activeTab
    if (tab) {
      tab.name = name
    }
  }
}

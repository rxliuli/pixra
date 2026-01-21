import { makeAutoObservable } from 'mobx'

// 历史记录条目
export interface HistoryEntry {
  imageData: ImageBitmap
  timestamp: number
}

// 文档接口
export interface Document {
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

export class DocumentStore {
  documents: Map<string, Document> = new Map()
  activeDocumentId: string | null = null
  private maxHistorySize = 50

  constructor() {
    makeAutoObservable(this)
  }

  // 获取当前活动文档
  get activeDocument(): Document | null {
    if (!this.activeDocumentId) return null
    return this.documents.get(this.activeDocumentId) ?? null
  }

  // 获取文档列表
  get documentList(): Document[] {
    return Array.from(this.documents.values())
  }

  // 是否有文档
  get hasDocuments(): boolean {
    return this.documents.size > 0
  }

  // 是否可以撤销
  get canUndo(): boolean {
    const doc = this.activeDocument
    return doc ? doc.historyIndex > 0 : false
  }

  // 是否可以重做
  get canRedo(): boolean {
    const doc = this.activeDocument
    return doc ? doc.historyIndex < doc.history.length - 1 : false
  }

  // 创建文档
  createDocument(imageData?: ImageBitmap | null, name?: string): string {
    const id = generateId()
    const doc: Document = {
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
      doc.history.push({ imageData, timestamp: Date.now() })
      doc.historyIndex = 0
    }

    this.documents.set(id, doc)
    this.activeDocumentId = id
    return id
  }

  // 关闭文档
  closeDocument(id: string): void {
    const doc = this.documents.get(id)
    if (!doc) return

    // 清理历史记录释放内存
    doc.history = []
    this.documents.delete(id)

    // 如果关闭的是当前文档，切换到另一个
    if (this.activeDocumentId === id) {
      const remaining = Array.from(this.documents.keys())
      this.activeDocumentId = remaining.length > 0 ? remaining[remaining.length - 1] : null
    }
  }

  // 关闭所有文档
  closeAllDocuments(): void {
    for (const doc of this.documents.values()) {
      doc.history = []
    }
    this.documents.clear()
    this.activeDocumentId = null
  }

  // 切换文档
  switchDocument(id: string): void {
    if (!this.documents.has(id)) return
    if (this.activeDocumentId === id) return
    this.activeDocumentId = id
  }

  // 设置图像数据
  setImageData(imageData: ImageBitmap | null, addToHistory = true): void {
    const doc = this.activeDocument
    if (!doc) return

    doc.imageData = imageData

    if (imageData && addToHistory) {
      this.pushHistory(imageData)
    }
  }

  // 添加历史记录
  pushHistory(imageData: ImageBitmap): void {
    const doc = this.activeDocument
    if (!doc) return

    // 移除当前位置之后的所有历史
    doc.history = doc.history.slice(0, doc.historyIndex + 1)

    // 添加新状态
    doc.history.push({ imageData, timestamp: Date.now() })

    // 限制历史记录大小
    if (doc.history.length > this.maxHistorySize) {
      doc.history.shift()
    } else {
      doc.historyIndex++
    }

    doc.isDirty = true
  }

  // 撤销
  undo(): ImageBitmap | null {
    const doc = this.activeDocument
    if (!doc || !this.canUndo) return null

    doc.historyIndex--
    doc.imageData = doc.history[doc.historyIndex].imageData
    doc.isDirty = true
    return doc.imageData
  }

  // 重做
  redo(): ImageBitmap | null {
    const doc = this.activeDocument
    if (!doc || !this.canRedo) return null

    doc.historyIndex++
    doc.imageData = doc.history[doc.historyIndex].imageData
    doc.isDirty = true
    return doc.imageData
  }

  // 设置平移
  setPan(x: number, y: number): void {
    const doc = this.activeDocument
    if (!doc) return
    doc.viewState.pan = { x, y }
  }

  // 设置缩放
  setScale(scale: number): void {
    const doc = this.activeDocument
    if (!doc) return
    doc.viewState.scale = scale
  }

  // 重置视图
  resetView(): void {
    const doc = this.activeDocument
    if (!doc) return
    doc.viewState.pan = { x: 0, y: 0 }
    doc.viewState.scale = 1
  }

  // 标记为脏
  markDirty(): void {
    const doc = this.activeDocument
    if (doc) {
      doc.isDirty = true
    }
  }

  // 标记为干净
  markClean(): void {
    const doc = this.activeDocument
    if (doc) {
      doc.isDirty = false
    }
  }

  // 设置文档名称
  setDocumentName(name: string): void {
    const doc = this.activeDocument
    if (doc) {
      doc.name = name
    }
  }
}

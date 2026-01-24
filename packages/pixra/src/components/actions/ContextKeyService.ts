import { makeAutoObservable } from 'mobx'

/**
 * 上下文键服务
 * 管理全局上下文状态，用于 enablement 条件求值
 */
export class ContextKeyService {
  private context = new Map<string, unknown>()

  constructor() {
    makeAutoObservable(this)
  }

  /**
   * 设置上下文键值
   */
  set(key: string, value: unknown): void {
    this.context.set(key, value)
  }

  /**
   * 批量设置上下文键值
   */
  setMany(entries: Record<string, unknown>): void {
    Object.entries(entries).forEach(([key, value]) => {
      this.context.set(key, value)
    })
  }

  /**
   * 获取上下文键值
   */
  get(key: string): unknown {
    return this.context.get(key)
  }

  /**
   * 删除上下文键
   */
  delete(key: string): void {
    this.context.delete(key)
  }

  /**
   * 检查上下文键是否存在
   */
  has(key: string): boolean {
    return this.context.has(key)
  }

  /**
   * 获取所有上下文键值（用于调试）
   */
  getAll(): Record<string, unknown> {
    return Object.fromEntries(this.context.entries())
  }

  /**
   * 清空所有上下文
   */
  clear(): void {
    this.context.clear()
  }
}

// 导出单例
export const contextKeyService = new ContextKeyService()

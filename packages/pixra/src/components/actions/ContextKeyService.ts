import { makeAutoObservable } from 'mobx'

/**
 * Context Key Service
 * Manages global context state for enablement condition evaluation
 */
export class ContextKeyService {
  private context = new Map<string, unknown>()

  constructor() {
    makeAutoObservable(this)
  }

  set(key: string, value: unknown): void {
    this.context.set(key, value)
  }

  setMany(entries: Record<string, unknown>): void {
    Object.entries(entries).forEach(([key, value]) => {
      this.context.set(key, value)
    })
  }

  get(key: string): unknown {
    return this.context.get(key)
  }

  delete(key: string): void {
    this.context.delete(key)
  }

  has(key: string): boolean {
    return this.context.has(key)
  }

  getAll(): Record<string, unknown> {
    return Object.fromEntries(this.context.entries())
  }

  clear(): void {
    this.context.clear()
  }
}

export const contextKeyService = new ContextKeyService()

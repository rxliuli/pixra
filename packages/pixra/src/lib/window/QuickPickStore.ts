import { makeAutoObservable } from 'mobx'

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

export class QuickPickStore {
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

export const quickPickStore = new QuickPickStore()

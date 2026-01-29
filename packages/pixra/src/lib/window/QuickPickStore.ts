import { makeAutoObservable } from 'mobx'

export interface QuickPickItem<T = any> {
  label: string
  description?: string
  detail?: string
  value?: T
}

export interface QuickPickOptions<T = any> {
  title?: string
  placeholder?: string
  /**
   * The item that should be initially selected/highlighted.
   * Useful for setting a default selection based on current state.
   */
  activeItem?: QuickPickItem<T>
  /**
   * Called when the user highlights (focuses) a different item in the list.
   * Useful for implementing preview functionality.
   */
  onDidSelectItem?: (item: QuickPickItem<T>) => void
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
  activeItem?: QuickPickItem<T>
  onDidSelectItem?: (item: QuickPickItem<T>) => void
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
    options?: QuickPickOptions<T>,
  ): Promise<QuickPickItem<T> | undefined> {
    return new Promise((resolve, reject) => {
      this.state = {
        type: 'quickpick',
        items,
        title: options?.title,
        placeholder: options?.placeholder,
        activeItem: options?.activeItem,
        onDidSelectItem: options?.onDidSelectItem,
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

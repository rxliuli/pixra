import { makeAutoObservable } from 'mobx'
import type { ComponentType } from 'react'

export type DialogResult = 'ok' | 'cancel'

export interface ShowDialogOptions {
  title?: string
  description?: string
  footer?: boolean
  props?: Record<string, unknown>
  className?: string
}

interface DialogState {
  id: number
  Component: ComponentType<any>
  options: ShowDialogOptions
  resolve: (result: DialogResult) => void
}

export class DialogStore {
  private state: DialogState | null = null
  private nextId = 0

  constructor() {
    makeAutoObservable(this)
  }

  get isOpen() {
    return this.state !== null
  }

  get currentState() {
    return this.state
  }

  showDialog(
    Component: ComponentType<any>,
    options?: ShowDialogOptions,
  ): Promise<DialogResult> {
    return new Promise((resolve) => {
      this.state = {
        id: this.nextId++,
        Component,
        options: options ?? {},
        resolve,
      }
    })
  }

  accept() {
    if (this.state?.resolve) {
      this.state.resolve('ok')
      this.state = null
    }
  }

  cancel() {
    if (this.state?.resolve) {
      this.state.resolve('cancel')
      this.state = null
    }
  }
}

export const dialogStore = new DialogStore()

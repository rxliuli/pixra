import { toast } from 'sonner'
import {
  quickPickStore,
  type InputBoxOptions,
  type QuickPickItem,
  type QuickPickOptions,
} from './QuickPickStore'
import {
  dialogStore,
  type DialogResult,
  type ShowDialogOptions,
} from './DialogStore'
import type { ComponentType } from 'react'

export interface ProgressOptions {
  title: string
}

export interface Progress {
  report(value: { message?: string; percentage?: number }): void
}

function renderProgressDescription(
  message?: string,
  percentage?: number,
): string | undefined {
  const parts: string[] = []
  if (message) parts.push(message)
  if (percentage !== undefined) parts.push(`${Math.round(percentage)}%`)
  return parts.length > 0 ? parts.join(' · ') : undefined
}

/**
 * Shows an information message.
 */
export function showInformationMessage(message: string): void {
  toast.info(message)
}

/**
 * Shows a warning message.
 */
export function showWarningMessage(message: string): void {
  toast.warning(message)
}

/**
 * Shows an error message.
 */
export function showErrorMessage(message: string): void {
  toast.error(message)
}

/**
 * Shows a selection list allowing the user to select one item.
 *
 * @param items An array of items to pick from.
 * @param options Configures the behavior of the selection list.
 * @returns A promise that resolves to the selected item or `undefined`.
 */
export function showQuickPick<T = any>(
  items: QuickPickItem<T>[],
  options?: QuickPickOptions<T>,
): Promise<QuickPickItem<T> | undefined> {
  return quickPickStore.showQuickPick(items, options)
}

/**
 * Opens an input box to ask the user for input.
 *
 * @param options Configures the behavior of the input box.
 * @returns A promise that resolves to the entered string or `undefined`.
 */
export function showInputBox(
  options?: InputBoxOptions,
): Promise<string | undefined> {
  return quickPickStore.showInputBox(options)
}

/**
 * Show progress in the UI while running a task.
 *
 * @param options Options for the progress display.
 * @param task A function that performs the task and reports progress.
 * @returns A promise that resolves to the result of the task.
 */
export async function withProgress<T>(
  options: ProgressOptions,
  task: (progress: Progress) => Promise<T>,
): Promise<T> {
  const toastId = toast.loading(options.title)
  let currentMessage: string | undefined
  let currentPercentage: number | undefined

  const progress: Progress = {
    report(value) {
      currentMessage = value.message ?? currentMessage
      currentPercentage = value.percentage ?? currentPercentage
      toast.loading(options.title, {
        id: toastId,
        description: renderProgressDescription(
          currentMessage,
          currentPercentage,
        ),
      })
    },
  }

  try {
    const result = await task(progress)
    toast.dismiss(toastId)
    return result
  } catch (error) {
    toast.dismiss(toastId)
    throw error
  }
}

/**
 * Shows a dialog with a custom component.
 *
 * @param Component The React component to render inside the dialog.
 * @param options Options for the dialog display.
 * @returns A promise that resolves to 'ok' or 'cancel'.
 */
export function showDialog(
  Component: ComponentType<any>,
  options?: ShowDialogOptions,
): Promise<DialogResult> {
  return dialogStore.showDialog(Component, options)
}

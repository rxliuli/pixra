import { appStateStore } from '@/components/store'
import type { QuickPickItem, InputBoxOptions } from '@/components/store'

/**
 * VSCode-like window API for showing quick picks and input boxes
 */
export const window = {
  /**
   * Shows a selection list allowing multiple selections.
   *
   * @param items An array of items to pick from.
   * @param options Configures the behavior of the selection list.
   * @returns A promise that resolves to the selected item or `undefined`.
   */
  showQuickPick<T = any>(
    items: QuickPickItem<T>[],
    options?: { title?: string; placeholder?: string }
  ): Promise<QuickPickItem<T> | undefined> {
    return appStateStore.quickPickStore.showQuickPick(items, options)
  },

  /**
   * Opens an input box to ask the user for input.
   *
   * @param options Configures the behavior of the input box.
   * @returns A promise that resolves to the entered string or `undefined`.
   */
  showInputBox(options?: InputBoxOptions): Promise<string | undefined> {
    return appStateStore.quickPickStore.showInputBox(options)
  },
}

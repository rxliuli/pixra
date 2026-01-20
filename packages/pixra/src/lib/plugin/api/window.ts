/**
 * Window API implementations
 * Handles UI interactions like notifications, dialogs, etc.
 */

import { toast } from 'sonner'
import type { ApiContext } from './index'

export async function showInformationMessage(
  _ctx: ApiContext,
  message: string,
): Promise<void> {
  toast.info(message)
}

export async function showWarningMessage(
  _ctx: ApiContext,
  message: string,
): Promise<void> {
  toast.warning(message)
}

export async function showErrorMessage(
  _ctx: ApiContext,
  message: string,
): Promise<void> {
  toast.error(message)
}

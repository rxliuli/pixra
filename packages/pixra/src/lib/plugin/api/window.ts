/**
 * Window API implementations
 * Handles UI interactions like notifications, dialogs, etc.
 */

import { toast } from 'sonner'
import type { ApiContext } from './index'
import { appStateStore } from '../../../components/store'

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

/** Active progress sessions */
const progressSessions = new Map<
  string,
  {
    title: string
    cancellable: boolean
  }
>()

export async function startProgress(
  _ctx: ApiContext,
  progressId: string,
  options: { title: string; cancellable?: boolean },
): Promise<void> {
  progressSessions.set(progressId, {
    title: options.title,
    cancellable: options.cancellable ?? false,
  })

  // Show initial progress state
  appStateStore.progressStore.show({
    title: options.title,
    cancellable: options.cancellable ?? false,
  })
}

export function reportProgress(
  progressId: string,
  value: { message?: string; percentage?: number },
): void {
  const session = progressSessions.get(progressId)
  if (!session) return

  appStateStore.progressStore.update(value)
}

export function endProgress(progressId: string): void {
  progressSessions.delete(progressId)
  appStateStore.progressStore.hide()
}

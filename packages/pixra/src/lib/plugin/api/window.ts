/**
 * Window API implementations
 * Handles UI interactions like notifications, dialogs, etc.
 */

/**
 * Window API - Plugin wrapper layer
 * Thin wrapper around core window API for plugin use
 */
import { toast } from 'sonner'
import { ui } from '@/lib/window'
import type { ApiContext } from './index'

export async function showInformationMessage(
  _ctx: ApiContext,
  message: string,
): Promise<void> {
  ui.showInformationMessage(message)
}

export async function showWarningMessage(
  _ctx: ApiContext,
  message: string,
): Promise<void> {
  ui.showWarningMessage(message)
}

export async function showErrorMessage(
  _ctx: ApiContext,
  message: string,
): Promise<void> {
  ui.showErrorMessage(message)
}

/** Active progress sessions with toast IDs */
const progressSessions = new Map<
  string,
  {
    toastId: string | number
    title: string
    message?: string
    percentage?: number
    cancellable: boolean
    onCancel?: () => void
  }
>()

function renderProgressDescription(
  message?: string,
  percentage?: number,
): string | undefined {
  const parts: string[] = []
  if (message) parts.push(message)
  if (percentage !== undefined) parts.push(`${Math.round(percentage)}%`)
  return parts.length > 0 ? parts.join(' · ') : undefined
}

export async function startProgress(
  _ctx: ApiContext,
  progressId: string,
  options: { title: string; cancellable?: boolean },
): Promise<void> {
  const toastId = toast.loading(options.title)

  progressSessions.set(progressId, {
    toastId,
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

  session.message = value.message ?? session.message
  session.percentage = value.percentage ?? session.percentage

  toast.loading(session.title, {
    id: session.toastId,
    description: renderProgressDescription(session.message, session.percentage),
  })
}

export function endProgress(progressId: string): void {
  const session = progressSessions.get(progressId)
  if (!session) return

  toast.dismiss(session.toastId)
  progressSessions.delete(progressId)
}

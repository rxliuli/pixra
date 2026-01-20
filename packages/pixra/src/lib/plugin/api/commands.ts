/**
 * Commands API implementations
 * Handles command registration and execution
 */

import type { ApiContext } from './index'

export function registerCommand(
  ctx: ApiContext,
  _command: string,
  _callback: string,
): void {
  // Store disposable for cleanup
  const dispose = () => {
    // TODO: unregister command
  }

  ctx.disposables.push(dispose)
}

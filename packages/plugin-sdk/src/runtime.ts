/**
 * Plugin Worker Runtime
 *
 * This code runs inside the Web Worker and provides the sandboxed environment
 * for plugins. It creates the pixra API proxy and handles communication with
 * the main thread.
 *
 * This file is bundled and injected into the worker context by the plugin host.
 */

import { Commands, Window } from './api'

// Note: We don't import ExtensionContext here to avoid circular dependencies
// The type will be provided by the consuming code

// Sandboxed global environment
const extensionContext = {
  subscriptions: [] as Array<{ dispose(): void }>,
  extensionId: '',
  extensionVersion: '',
}

const commandHandlers = new Map<string, (...args: any[]) => any>()

// API proxy functions
function createApiProxy<T>(method: string) {
  return function (...args: any[]) {
    return new Promise((resolve, reject) => {
      const callId = Math.random().toString(36)

      const handler = (event: MessageEvent) => {
        if (event.data.callId === callId) {
          self.removeEventListener('message', handler)
          if (event.data.type === 'apiResult') {
            resolve(event.data.result)
          } else if (event.data.type === 'apiError') {
            reject(new Error(event.data.error))
          }
        }
      }

      self.addEventListener('message', handler)

      self.postMessage({
        type: 'apiCall',
        callId,
        method,
        args,
      })
    })
  } as T
}

// Pixra API implementation - set as globals directly
export const window: Window = {
  showInformationMessage: createApiProxy('window.showInformationMessage'),
  showWarningMessage: createApiProxy('window.showWarningMessage'),
  showErrorMessage: createApiProxy('window.showErrorMessage'),
}
export const commands: Commands = {
  registerCommand(command: string, callback: (...args: any[]) => any) {
    commandHandlers.set(command, callback)
    // Note: command is already registered in main thread from manifest
    // This just stores the handler in the worker
    return {
      dispose() {
        commandHandlers.delete(command)
      },
    }
  },
  executeCommand: createApiProxy('commands.executeCommand'),
}
export const workspace = {
  getActiveImage: createApiProxy('workspace.getActiveImage'),
  updateActiveImage: createApiProxy('workspace.updateActiveImage'),
  downloadFile: createApiProxy('workspace.downloadFile'),
}

// Clean up dangerous globals
delete (self as any).fetch
delete (self as any).indexedDB
delete (self as any).localStorage
delete (self as any).sessionStorage
delete (self as any).caches

// Message handler
globalThis.onmessage = async (event: MessageEvent) => {
  const { type, context, messageId, command, args } = event.data

  if (type === 'activate') {
    extensionContext.extensionId = context.extensionId
    extensionContext.extensionVersion = context.extensionVersion

    try {
      const activateFn =
        (globalThis as any).activate ?? (self as any).activate

      if (typeof activateFn !== 'function') {
        throw new Error('Plugin must expose an activate(context) function')
      }

      await activateFn(extensionContext)
      self.postMessage({ type: 'activated' })
    } catch (error) {
      self.postMessage({
        type: 'activateError',
        error: error instanceof Error ? error.message : String(error),
      })
    }
  } else if (type === 'deactivate') {
    // Call plugin's deactivate function
    const deactivateFn =
      (globalThis as any).deactivate ?? (self as any).deactivate
    if (typeof deactivateFn === 'function') {
      await deactivateFn()
    }

    // Dispose all subscriptions
    extensionContext.subscriptions.forEach((sub) => sub.dispose())
  } else if (type === 'executeCommand') {
    try {
      const handler = commandHandlers.get(command)
      if (!handler) {
        throw new Error(`Command handler not found: ${command}`)
      }
      const result = await handler(...(Array.isArray(args) ? args : []))
      self.postMessage({ type: 'commandResult', messageId, result })
    } catch (error) {
      self.postMessage({
        type: 'commandError',
        messageId,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }
}

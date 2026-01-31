/**
 * Plugin Worker Runtime
 *
 * This code runs inside the Web Worker and provides the sandboxed environment
 * for plugins. It creates the pixra API proxy and handles communication with
 * the main thread.
 *
 * This file is bundled and injected into the worker context by the plugin host.
 */

import { Commands, Configuration, Window } from './api'

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
  showInputBox: createApiProxy('window.showInputBox'),
  saveFile: createApiProxy('window.saveFile'),
  async withProgress(options, task) {
    const progressId = Math.random().toString(36)

    // Start progress
    await new Promise<void>((resolve, reject) => {
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
        method: 'window.startProgress',
        args: [progressId, options],
      })
    })

    try {
      const result = await task({
        report(value) {
          // Fire-and-forget progress report
          self.postMessage({
            type: 'progressReport',
            progressId,
            value,
          })
        },
      })
      return result
    } finally {
      // End progress
      self.postMessage({
        type: 'progressEnd',
        progressId,
      })
    }
  },
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
export const tabs = {
  getActive: createApiProxy('tabs.getActive'),
  getAll: createApiProxy('tabs.getAll'),
}

export const workspace = {
  getActiveImage: createApiProxy('workspace.getActiveImage'),
  updateActiveImage: createApiProxy('workspace.updateActiveImage'),
  getSelection: createApiProxy('workspace.getSelection'),
  clearSelection: createApiProxy('workspace.clearSelection'),
}

export const configuration: Configuration = {
  get: createApiProxy('configuration.get'),
  set: createApiProxy('configuration.set'),
}

// Clean up dangerous globals
const dangerousGlobals: (keyof typeof globalThis)[] = [
  'eval',
  'Function',
  'XMLHttpRequest',
  'WebSocket',
  // 'Worker', // allow Workers
  'SharedWorker',
  'indexedDB',
  'localStorage',
  'sessionStorage',
  'caches',
]

for (const key of dangerousGlobals) {
  try {
    delete globalThis[key]
  } catch {
    // Ignore if not deletable
  }
}

// Permissions configuration (will be set by host before activation)
let hasFetchPermission = false
let allowedHostPatterns: RegExp[] = []

/**
 * Convert URL pattern to RegExp
 * Supports patterns like "https://example.com/*", "https://*.example.com/*"
 */
function urlPatternToRegex(pattern: string): RegExp {
  // Escape special regex chars except * and ?
  let regexStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.')
  return new RegExp(`^${regexStr}$`)
}

/**
 * Check if URL is allowed by host_permissions
 */
function isUrlAllowed(url: string): boolean {
  if (!hasFetchPermission) return false
  // Always allow blob: and data: URLs (used internally by libraries)
  if (url.startsWith('blob:') || url.startsWith('data:')) return true
  if (allowedHostPatterns.length === 0) return false
  return allowedHostPatterns.some((pattern) => pattern.test(url))
}

// Store original fetch
const originalFetch = globalThis.fetch as typeof fetch

// Replace fetch with restricted version
globalThis.fetch = async function restrictedFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : input.url

  if (!isUrlAllowed(url)) {
    throw new Error(
      `Fetch blocked: URL "${url}" is not allowed. ` +
        `Add the URL pattern to host_permissions in plugin.json and include "fetch" in permissions.`,
    )
  }

  return originalFetch(input, init)
}

// Message handler
globalThis.onmessage = async (event: MessageEvent) => {
  const { type, context, messageId, command, args } = event.data

  if (type === 'activate') {
    extensionContext.extensionId = context.extensionId
    extensionContext.extensionVersion = context.extensionVersion

    // Setup permissions from context
    if (context.permissions?.includes('fetch')) {
      hasFetchPermission = true
      allowedHostPatterns = (context.hostPermissions || []).map(
        urlPatternToRegex,
      )
    }

    try {
      const activateFn = (globalThis as any).activate ?? (self as any).activate

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

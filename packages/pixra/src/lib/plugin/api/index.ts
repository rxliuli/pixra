/**
 * Plugin API dispatcher
 * Routes API calls from plugin workers to their implementations
 */

import * as windowApi from './window'
import * as commandsApi from './commands'
import * as workspaceApi from './workspace'

/**
 * Context passed to API handlers
 */
export interface ApiContext {
  pluginId: string
  disposables: Array<() => void>
}

type ApiHandler = (ctx: ApiContext, ...args: any[]) => any

/**
 * Registry of all API handlers
 * Key format: "namespace.method" (e.g., "window.showInformationMessage")
 */
const apiHandlers: Record<string, ApiHandler> = {
  'window.showInformationMessage': windowApi.showInformationMessage,
  'window.showWarningMessage': windowApi.showWarningMessage,
  'window.showErrorMessage': windowApi.showErrorMessage,
  'commands.registerCommand': commandsApi.registerCommand,
  'workspace.getActiveImage': workspaceApi.getActiveImage,
  'workspace.updateActiveImage': workspaceApi.updateActiveImage,
  'workspace.downloadFile': workspaceApi.downloadFile,
}

/**
 * Execute an API call
 * @param method - The API method name (e.g., "window.showInformationMessage")
 * @param ctx - The API context
 * @param args - Arguments passed from the plugin
 * @returns The result of the API call
 */
export async function executeApiCall(
  method: string,
  ctx: ApiContext,
  args: any[],
): Promise<any> {
  const handler = apiHandlers[method]
  if (!handler) {
    throw new Error(`Unknown API method: ${method}`)
  }
  return handler(ctx, ...args)
}

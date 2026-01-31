import type { PluginManifest } from '@pixra/plugin-sdk'
import { PluginLoader, type InstalledPlugin } from './PluginLoader'
import { PluginStorage } from './PluginStorage'
import { commandRegistry, menuRegistry } from '../../components/actions'
import sdkRuntimeCode from '@pixra/plugin-sdk/runtime?bundle'
import type { Plugin } from 'esbuild-wasm'
import { executeApiCall, type ApiContext } from './api'
import { endProgress, reportProgress } from './api/window'
import { fetchPlugins, type PluginInfo } from './PluginStoreService'

/**
 * Information about a plugin that has an update available
 */
export interface PluginUpdateInfo {
  id: string
  name: string
  currentVersion: string
  latestVersion: string
  remotePlugin: PluginInfo
}

/**
 * Active plugin instance
 */
interface ActivePlugin {
  manifest: PluginManifest
  worker: Worker
  disposables: Array<() => void>
}

/**
 * Plugin Manager - manages plugin lifecycle
 */
export class PluginManager {
  private loader = new PluginLoader()
  private storage = new PluginStorage()
  private activePlugins = new Map<string, ActivePlugin>()
  private initialized = false
  private esbuildInitialized = false
  private registeredPluginCommands = new Map<string, string[]>() // pluginId -> command ids
  private registeredPluginMenuItems = new Map<
    string,
    Array<{ groupId: string; commandId: string }>
  >() // pluginId -> menu items

  /**
   * Initialize plugin system - load all installed plugins and register commands
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }
    this.initialized = true

    // Load all installed plugins from storage
    const plugins = await this.storage.listPlugins()

    // Register commands for all enabled plugins
    for (const plugin of plugins) {
      if (plugin.enabled) {
        this.registerPluginCommands(plugin.manifest)
      }
    }

    console.log(`Loaded ${plugins.length} plugin(s) from storage`)
  }

  /**
   * Install or update plugin from ZIP file (no confirmation)
   */
  async installFromZip(file: File): Promise<boolean> {
    // Load plugin
    const { manifest, files } = await this.loader.loadFromZip(file)

    // Check if already installed
    const existingPlugin = await this.storage.loadPlugin(manifest.id)
    if (existingPlugin) {
      // Deactivate if running
      if (this.activePlugins.has(manifest.id)) {
        await this.deactivatePlugin(manifest.id)
      }

      // Unregister old commands
      this.unregisterPluginCommands(manifest.id)
    }

    // Save to storage (will overwrite if exists)
    const plugin: InstalledPlugin = {
      manifest,
      files,
      installDate: existingPlugin?.installDate || new Date(),
      enabled: true,
    }

    await this.storage.savePlugin(plugin)

    // Register commands (lazy activation)
    this.registerPluginCommands(manifest)
    return true
  }

  /**
   * Check if a plugin is already installed
   */
  async isInstalled(pluginId: string): Promise<boolean> {
    return this.storage.hasPlugin(pluginId)
  }

  /**
   * Get installed plugin info (for checking version, etc.)
   */
  async getInstalled(pluginId: string): Promise<InstalledPlugin | null> {
    return this.storage.loadPlugin(pluginId)
  }

  /**
   * Uninstall plugin
   */
  async uninstall(pluginId: string): Promise<void> {
    // Deactivate if running
    if (this.activePlugins.has(pluginId)) {
      await this.deactivatePlugin(pluginId)
    }

    // Remove from storage
    await this.storage.deletePlugin(pluginId)

    // Unregister commands
    this.unregisterPluginCommands(pluginId)
  }

  /**
   * List all installed plugins
   */
  async listInstalled(): Promise<InstalledPlugin[]> {
    return this.storage.listPlugins()
  }

  /**
   * Check for plugin updates by comparing installed versions with remote versions
   */
  async checkForUpdates(): Promise<PluginUpdateInfo[]> {
    const installed = await this.storage.listPlugins()
    if (installed.length === 0) {
      return []
    }

    const { plugins: remotePlugins } = await fetchPlugins()
    const remotePluginMap = new Map(remotePlugins.map((p) => [p.id, p]))

    const updates: PluginUpdateInfo[] = []
    for (const plugin of installed) {
      const remote = remotePluginMap.get(plugin.manifest.id)
      if (remote && remote.version !== plugin.manifest.version) {
        updates.push({
          id: plugin.manifest.id,
          name: plugin.manifest.name,
          currentVersion: plugin.manifest.version,
          latestVersion: remote.version,
          remotePlugin: remote,
        })
      }
    }

    return updates
  }

  /**
   * Activate plugin (create worker and run)
   */
  async activatePlugin(pluginId: string): Promise<void> {
    // Already active
    if (this.activePlugins.has(pluginId)) {
      return
    }

    // Load plugin
    const plugin = await this.storage.loadPlugin(pluginId)
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`)
    }

    if (!plugin.enabled) {
      throw new Error(`Plugin ${pluginId} is disabled`)
    }

    // Create worker with plugin code
    const workerCode = await this.createWorkerCode(plugin)
    // console.log(`Creating worker for plugin ${pluginId}`, workerCode)
    const blob = new Blob([workerCode], { type: 'application/javascript' })
    const worker = new Worker(URL.createObjectURL(blob), {
      type: 'module',
    })

    const disposables: Array<() => void> = []

    // Setup message handler
    worker.onmessage = (event) => {
      this.handleWorkerMessage(pluginId, event.data)
    }

    worker.onerror = (error) => {
      console.error(`Plugin ${pluginId} error:`, error)
    }

    // Store active plugin
    this.activePlugins.set(pluginId, {
      manifest: plugin.manifest,
      worker,
      disposables,
    })

    // Wait for worker activation to complete to avoid executeCommand races.
    const activated = new Promise<void>((resolve, reject) => {
      const timeoutMs = 5000
      const timeout = window.setTimeout(() => {
        worker.removeEventListener('message', handler)
        reject(
          new Error(`Plugin ${pluginId} activation timed out (${timeoutMs}ms)`),
        )
      }, timeoutMs)

      const handler = (event: MessageEvent) => {
        if (event.data?.type === 'activated') {
          window.clearTimeout(timeout)
          worker.removeEventListener('message', handler)
          resolve()
        } else if (event.data?.type === 'activateError') {
          window.clearTimeout(timeout)
          worker.removeEventListener('message', handler)
          reject(new Error(event.data.error))
        }
      }

      worker.addEventListener('message', handler)
    })

    // Send activation message
    worker.postMessage({
      type: 'activate',
      context: {
        extensionId: plugin.manifest.id,
        extensionVersion: plugin.manifest.version,
        permissions: plugin.manifest.permissions,
        hostPermissions: plugin.manifest.host_permissions,
      },
    })

    await activated
  }

  /**
   * Deactivate plugin
   */
  async deactivatePlugin(pluginId: string): Promise<void> {
    const active = this.activePlugins.get(pluginId)
    if (!active) {
      return
    }

    // Send deactivate message
    active.worker.postMessage({ type: 'deactivate' })

    // Clean up
    active.worker.terminate()
    active.disposables.forEach((dispose) => dispose())

    this.activePlugins.delete(pluginId)
  }

  /**
   * Register plugin commands (lazy)
   */
  private registerPluginCommands(manifest: PluginManifest): void {
    const commands = manifest.contributes?.commands || []
    const commandIds: string[] = []

    // Build a map of command id -> title for menu registration
    const commandTitleMap = new Map<string, string>()
    for (const cmd of commands) {
      commandTitleMap.set(cmd.command, cmd.title)
    }

    for (const cmd of commands) {
      commandRegistry.registerCommand({
        command: cmd.command,
        title: cmd.title,
        enablement: cmd.enablement,
        execute: async () => {
          // Activate plugin if not active
          if (!this.activePlugins.has(manifest.id)) {
            await this.activatePlugin(manifest.id)
          }

          // Execute command in worker
          return this.executePluginCommand(manifest.id, cmd.command)
        },
      })
      commandIds.push(cmd.command)
    }

    // Register menu contributions
    const menus = manifest.contributes?.menus
    const menuItemsTracked: Array<{ groupId: string; commandId: string }> = []
    if (menus) {
      for (const [groupId, menuItems] of Object.entries(menus)) {
        for (const menuItem of menuItems) {
          const title = commandTitleMap.get(menuItem.command)
          if (title) {
            menuRegistry.addMenuItem(groupId, {
              type: 'item',
              command: menuItem.command,
              title,
            })
            menuItemsTracked.push({ groupId, commandId: menuItem.command })
          }
        }
      }
    }

    // Track registered commands and menu items for this plugin
    this.registeredPluginCommands.set(manifest.id, commandIds)
    this.registeredPluginMenuItems.set(manifest.id, menuItemsTracked)
  }

  /**
   * Unregister plugin commands and menu items
   */
  private unregisterPluginCommands(pluginId: string): void {
    // Unregister all commands for this plugin
    const commandIds = this.registeredPluginCommands.get(pluginId)
    if (commandIds) {
      for (const commandId of commandIds) {
        commandRegistry.unregisterCommand(commandId)
      }
      this.registeredPluginCommands.delete(pluginId)
    }

    // Unregister all menu items for this plugin
    const menuItems = this.registeredPluginMenuItems.get(pluginId)
    if (menuItems) {
      for (const { groupId, commandId } of menuItems) {
        menuRegistry.removeMenuItem(groupId, commandId)
      }
      this.registeredPluginMenuItems.delete(pluginId)
    }
  }

  /**
   * Execute command in plugin worker
   */
  private async executePluginCommand(
    pluginId: string,
    command: string,
  ): Promise<any> {
    const active = this.activePlugins.get(pluginId)
    if (!active) {
      throw new Error(`Plugin ${pluginId} is not active`)
    }

    return new Promise((resolve, reject) => {
      const messageId = Math.random().toString(36)

      const handler = (event: MessageEvent) => {
        if (event.data.messageId === messageId) {
          active.worker.removeEventListener('message', handler)

          if (event.data.type === 'commandResult') {
            resolve(event.data.result)
          } else if (event.data.type === 'commandError') {
            reject(new Error(event.data.error))
          }
        }
      }

      active.worker.addEventListener('message', handler)

      active.worker.postMessage({
        type: 'executeCommand',
        messageId,
        command,
      })
    })
  }

  /**
   * Handle messages from plugin worker
   */
  private handleWorkerMessage(pluginId: string, message: any): void {
    switch (message.type) {
      case 'apiCall':
        this.handleApiCall(pluginId, message)
        break
      case 'progressReport':
        this.handleProgressReport(message)
        break
      case 'progressEnd':
        this.handleProgressEnd(message)
        break
      case 'log':
        console.log(`[Plugin ${pluginId}]`, ...message.args)
        break
      default:
        // Handled by specific promise handlers
        break
    }
  }

  /**
   * Handle progress report from plugin
   */
  private handleProgressReport(message: any): void {
    const { progressId, value } = message
    reportProgress(progressId, value)
  }

  /**
   * Handle progress end from plugin
   */
  private handleProgressEnd(message: any): void {
    const { progressId } = message
    endProgress(progressId)
  }

  /**
   * Handle API calls from plugin
   */
  private async handleApiCall(pluginId: string, message: any): Promise<void> {
    const active = this.activePlugins.get(pluginId)
    if (!active) return

    const { callId, method, args } = message

    const ctx: ApiContext = {
      pluginId,
      disposables: active.disposables,
    }

    try {
      const result = await executeApiCall(method, ctx, args)

      active.worker.postMessage({
        type: 'apiResult',
        callId,
        result,
      })
    } catch (error) {
      active.worker.postMessage({
        type: 'apiError',
        callId,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  /**
   * Create worker code with SDK runtime and plugin code
   */
  private async createWorkerCode(plugin: InstalledPlugin): Promise<string> {
    const mainFile = plugin.files[plugin.manifest.main]
    if (!mainFile || typeof mainFile !== 'string') {
      throw new Error(`Main file ${plugin.manifest.main} not found or invalid`)
    }

    // Bundle plugin code with SDK runtime as a module
    const bundledCode = await this.bundlePlugin(plugin.manifest.main, mainFile)

    return bundledCode
  }

  /**
   * Bundle plugin code with esbuild-wasm
   */
  private async bundlePlugin(
    entryPoint: string,
    code: string,
  ): Promise<string> {
    // Initialize esbuild (only once)
    const esbuild = await import('esbuild-wasm')
    if (!this.esbuildInitialized) {
      const esbuildWasmUrl = (await import('esbuild-wasm/esbuild.wasm?url'))
        .default
      await esbuild.initialize({
        wasmURL: esbuildWasmUrl,
      })
      this.esbuildInitialized = true
    }

    try {
      const result = await esbuild.build({
        stdin: {
          contents: code,
          loader: 'js',
          resolveDir: '/',
          sourcefile: entryPoint,
        },
        bundle: true,
        format: 'esm',
        globalName: '__plugin',
        write: false,
        platform: 'browser',
        target: 'esnext',
        // External: @pixra/plugin-sdk will be provided by SDK runtime
        external: [],
        plugins: [
          vfs([
            {
              path: '@pixra/plugin-sdk',
              content: sdkRuntimeCode,
            },
          ]),
        ],
      })

      if (result.outputFiles && result.outputFiles.length > 0) {
        // Extract activate and deactivate functions from IIFE
        const bundled = new TextDecoder().decode(result.outputFiles[0].contents)

        // Expose activate/deactivate on globalThis so the SDK runtime can find them.
        return `
${bundled}
// Extract activate and deactivate from bundle
if (typeof activate !== 'function') {
  throw new Error('Plugin must export an activate function');
}
globalThis.activate = activate;
if (typeof deactivate === 'function') {
  globalThis.deactivate = deactivate;
}
        `.trim()
      }

      throw new Error('esbuild produced no output')
    } catch (error) {
      console.error('Failed to bundle plugin:', error)
      throw new Error(
        `Plugin bundling failed: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }
}

// Singleton instance
export const pluginManager = new PluginManager()

export function vfs(files: { path: string; content: string }[]): Plugin {
  return {
    name: 'vfs',
    setup(build) {
      build.onResolve({ filter: /()/ }, ({ path }) => {
        const file = files.find((f) => f.path === path)
        if (file) {
          return {
            path,
            namespace: 'vfs',
            pluginData: file.content,
          }
        }
      })
      build.onLoad({ filter: /.*/, namespace: 'vfs' }, ({ pluginData }) => {
        return {
          contents: pluginData,
          loader: 'ts',
        }
      })
    },
  }
}

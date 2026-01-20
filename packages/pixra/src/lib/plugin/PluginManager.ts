import type { PluginManifest } from '@pixra/plugin-sdk'
import { PluginLoader, type InstalledPlugin } from './PluginLoader'
import { PluginStorage } from './PluginStorage'
import { commandRegistry } from '../../components/actions'
import esbuildWasmUrl from 'esbuild-wasm/esbuild.wasm?url'
import sdkRuntimeCode from '@pixra/plugin-sdk/runtime?bundle'
import { type Plugin } from 'esbuild-wasm'

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
   * Install plugin from ZIP file
   */
  async installFromZip(file: File): Promise<void> {
    // Load plugin
    const { manifest, files } = await this.loader.loadFromZip(file)

    // Check if already installed
    const existingPlugin = await this.storage.loadPlugin(manifest.id)
    if (existingPlugin) {
      // Ask user if they want to update
      const shouldUpdate = confirm(
        `Plugin ${manifest.name} (${manifest.id}) is already installed (v${existingPlugin.manifest.version}).\n\n` +
          `Do you want to update it to v${manifest.version}?`,
      )

      if (!shouldUpdate) {
        return
      }

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
        reject(new Error(`Plugin ${pluginId} activation timed out (${timeoutMs}ms)`))
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

    for (const cmd of commands) {
      commandRegistry.registerCommand({
        command: cmd.command,
        title: cmd.title,
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

    // Track registered commands for this plugin
    this.registeredPluginCommands.set(manifest.id, commandIds)
  }

  /**
   * Unregister plugin commands
   */
  private unregisterPluginCommands(pluginId: string): void {
    const commandIds = this.registeredPluginCommands.get(pluginId)
    if (!commandIds) return

    // Unregister all commands for this plugin
    for (const commandId of commandIds) {
      commandRegistry.unregisterCommand(commandId)
    }

    this.registeredPluginCommands.delete(pluginId)
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
      case 'log':
        console.log(`[Plugin ${pluginId}]`, ...message.args)
        break
      default:
        // Handled by specific promise handlers
        break
    }
  }

  /**
   * Handle API calls from plugin
   */
  private async handleApiCall(pluginId: string, message: any): Promise<void> {
    const active = this.activePlugins.get(pluginId)
    if (!active) return

    const { callId, method, args } = message

    try {
      let result: any

      // Handle different API calls
      if (method === 'window.showInformationMessage') {
        result = await this.showMessage('info', args[0])
      } else if (method === 'window.showWarningMessage') {
        result = await this.showMessage('warning', args[0])
      } else if (method === 'window.showErrorMessage') {
        result = await this.showMessage('error', args[0])
      } else if (method === 'commands.registerCommand') {
        result = this.registerWorkerCommand(pluginId, args[0], args[1])
      } else {
        throw new Error(`Unknown API method: ${method}`)
      }

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
   * Show message to user
   */
  private async showMessage(
    level: 'info' | 'warning' | 'error',
    message: string,
  ): Promise<void> {
    // TODO: integrate with actual UI notification system
    console[level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'log'](
      message,
    )
    alert(message) // Temporary simple implementation
  }

  /**
   * Register command from worker
   */
  private registerWorkerCommand(
    pluginId: string,
    _command: string,
    _callback: string,
  ): void {
    const active = this.activePlugins.get(pluginId)
    if (!active) return

    // Store disposable for cleanup
    const dispose = () => {
      // TODO: unregister command
    }

    active.disposables.push(dispose)
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
    const esbuild = await import('esbuild-wasm')

    // Initialize esbuild (only once)
    if (!this.esbuildInitialized) {
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

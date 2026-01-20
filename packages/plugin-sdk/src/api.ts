/**
 * Plugin API - Type declarations
 *
 * These are pure type declarations that will be provided by the runtime.
 * The actual implementations are in runtime.ts and injected by the plugin host.
 */

/** Extension context passed to activate function */
export interface ExtensionContext {
  /** Subscriptions that will be disposed when plugin deactivates */
  subscriptions: Disposable[]
  /** Plugin's unique identifier */
  extensionId: string
  /** Plugin's version */
  extensionVersion: string
}

/** Disposable resource */
export interface Disposable {
  dispose(): void
}

/** Window API - UI interactions */
export interface Window {
  /**
   * Show an information message
   */
  showInformationMessage(message: string): Promise<void>

  /**
   * Show a warning message
   */
  showWarningMessage(message: string): Promise<void>

  /**
   * Show an error message
   */
  showErrorMessage(message: string): Promise<void>
}

/** Commands API - command registration */
export interface Commands {
  /**
   * Register a command handler
   */
  registerCommand(
    command: string,
    callback: (...args: any[]) => any
  ): Disposable

  /**
   * Execute a command
   */
  executeCommand(command: string, ...args: any[]): Promise<any>
}

/** Workspace API - workspace interactions */
export interface Workspace {
  /**
   * Get the currently active image
   */
  getActiveImage(): Promise<ImageData | null>

  /**
   * Update the active image
   */
  updateActiveImage(imageData: ImageData): Promise<void>

  /**
   * Download a file to the user's device
   * @param filename - The suggested filename for download
   * @param data - The file content as ArrayBuffer
   */
  downloadFile(filename: string, data: ArrayBuffer): Promise<void>
}

// Type declarations - these will be provided by the runtime at runtime
declare const window: Window
declare const commands: Commands
declare const workspace: Workspace

export { window, commands, workspace }

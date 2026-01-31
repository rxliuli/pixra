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

/** Options for saving a file */
export interface SaveFileOptions {
  /** Suggested filename for the saved file */
  filename: string
  /** File content as ArrayBuffer */
  data: ArrayBuffer
}

/** Options for input box */
export interface InputBoxOptions {
  /** Title shown in the input box */
  title?: string
  /** Placeholder text shown in the input field */
  placeholder?: string
  /** Prompt text shown above the input field */
  prompt?: string
  /** Default value in the input field */
  value?: string
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

  /**
   * Opens an input box to ask the user for input
   * @param options - Configuration for the input box
   * @returns A promise that resolves to the entered string or undefined if cancelled
   */
  showInputBox(options?: InputBoxOptions): Promise<string | undefined>

  /**
   * Show a progress dialog while executing a task
   * @param options - Progress options
   * @param task - The task to execute with progress reporting
   * @returns The result of the task
   */
  withProgress<T>(
    options: ProgressOptions,
    task: (progress: Progress) => Promise<T>
  ): Promise<T>

  /**
   * Save a file to the user's device
   * @param options - Save file options
   */
  saveFile(options: SaveFileOptions): Promise<void>
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

/** Selection rectangle */
export interface SelectionRect {
  x: number
  y: number
  width: number
  height: number
}

/** Tab metadata */
export interface TabMetadata {
  /** Unique tab identifier */
  readonly id: string
  /** Tab display name */
  readonly name: string
  /** File path if the tab represents a file */
  readonly filePath?: string
  /** Whether the tab has unsaved changes */
  readonly isDirty: boolean
}

/** Tabs API - tab management */
export interface Tabs {
  /**
   * Get the currently active tab
   * @returns The active tab or undefined if no tab is open
   */
  getActive(): Promise<TabMetadata | undefined>

  /**
   * Get all open tabs
   * @returns Array of all tab metadata
   */
  getAll(): Promise<readonly TabMetadata[]>
}

/** Configuration API - plugin settings management */
export interface Configuration {
  /**
   * Get a configuration value
   * @param key - The configuration key (e.g., "openai-edit.apiKey")
   * @returns The configuration value or undefined if not set
   */
  get<T extends string | number | boolean>(key: string): Promise<T | undefined>

  /**
   * Set a configuration value
   * @param key - The configuration key
   * @param value - The value to set
   */
  set<T extends string | number | boolean>(key: string, value: T): Promise<void>
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
   * Get the current selection (relative to original image coordinates)
   * @returns The selection rectangle or null if no selection
   */
  getSelection(): Promise<SelectionRect | null>

  /**
   * Clear the current selection
   */
  clearSelection(): Promise<void>
}

/** Progress options */
export interface ProgressOptions {
  /** Title shown in the progress dialog */
  title: string
  /** Whether the operation can be cancelled */
  cancellable?: boolean
}

/** Progress reporter */
export interface Progress {
  /** Report progress update */
  report(value: { message?: string; percentage?: number }): void
}

// Type declarations - these will be provided by the runtime at runtime
declare const window: Window
declare const commands: Commands
declare const workspace: Workspace
declare const tabs: Tabs
declare const configuration: Configuration

export { window, commands, workspace, tabs, configuration }

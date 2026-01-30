---
title: API Reference
description: Complete API documentation for Pixra plugin development.
---

The Pixra Plugin SDK provides four main namespaces: `window`, `commands`, `workspace`, and `tabs`.

## Import

```typescript
import { commands, window, workspace, tabs, ExtensionContext } from '@pixra/plugin-sdk'
```

## ExtensionContext

Passed to the `activate` function when your plugin is activated.

```typescript
interface ExtensionContext {
  /** Subscriptions that will be disposed when plugin deactivates */
  subscriptions: Disposable[]
  /** Plugin's unique identifier */
  extensionId: string
  /** Plugin's version */
  extensionVersion: string
}
```

### Usage

```typescript
export function activate(context: ExtensionContext) {
  // Add disposables to subscriptions for automatic cleanup
  context.subscriptions.push(
    commands.registerCommand('my.command', () => {})
  )

  console.log(`Plugin ${context.extensionId} v${context.extensionVersion} activated`)
}
```

## window

UI interaction APIs for showing messages and progress dialogs.

### showInformationMessage

Show an informational message to the user.

```typescript
window.showInformationMessage(message: string): Promise<void>
```

**Example:**

```typescript
await window.showInformationMessage('Operation completed successfully!')
```

### showWarningMessage

Show a warning message to the user.

```typescript
window.showWarningMessage(message: string): Promise<void>
```

**Example:**

```typescript
await window.showWarningMessage('This action cannot be undone.')
```

### showErrorMessage

Show an error message to the user.

```typescript
window.showErrorMessage(message: string): Promise<void>
```

**Example:**

```typescript
await window.showErrorMessage('Failed to process image.')
```

### withProgress

Show a progress dialog while executing a long-running task.

```typescript
window.withProgress<T>(
  options: ProgressOptions,
  task: (progress: Progress) => Promise<T>
): Promise<T>

interface ProgressOptions {
  title: string
  cancellable?: boolean
}

interface Progress {
  report(value: { message?: string; percentage?: number }): void
}
```

**Example:**

```typescript
const result = await window.withProgress(
  { title: 'Processing image...', cancellable: true },
  async (progress) => {
    progress.report({ message: 'Loading...', percentage: 0 })

    // Do work...
    progress.report({ message: 'Analyzing...', percentage: 50 })

    // More work...
    progress.report({ message: 'Finishing...', percentage: 90 })

    return 'done'
  }
)
```

### saveFile

Save a file to the user's device.

```typescript
window.saveFile(options: SaveFileOptions): Promise<void>

interface SaveFileOptions {
  /** Suggested filename for the saved file */
  filename: string
  /** File content as ArrayBuffer */
  data: ArrayBuffer
}
```

**Example:**

```typescript
// Save a text file
const text = 'Hello, World!'
const encoder = new TextEncoder()
const data = encoder.encode(text).buffer

await window.saveFile({ filename: 'hello.txt', data })
```

## commands

Command registration and execution APIs.

### registerCommand

Register a handler for a command. Returns a `Disposable` that should be added to `context.subscriptions`.

```typescript
commands.registerCommand(
  command: string,
  callback: (...args: any[]) => any
): Disposable
```

**Example:**

```typescript
context.subscriptions.push(
  commands.registerCommand('myPlugin.doSomething', async () => {
    // Handle command
    await window.showInformationMessage('Command executed!')
  })
)
```

### executeCommand

Execute a registered command programmatically.

```typescript
commands.executeCommand(command: string, ...args: any[]): Promise<any>
```

**Example:**

```typescript
// Execute another command
await commands.executeCommand('edit.undo')

// Execute with arguments
await commands.executeCommand('myPlugin.processImage', { quality: 90 })
```

## workspace

APIs for interacting with images and files.

### getActiveImage

Get the currently active image as `ImageData`.

```typescript
workspace.getActiveImage(): Promise<ImageData | null>
```

Returns `null` if no image is currently open.

**Example:**

```typescript
const imageData = await workspace.getActiveImage()
if (!imageData) {
  await window.showErrorMessage('No image is open')
  return
}

// Access pixel data
const { width, height, data } = imageData
console.log(`Image size: ${width}x${height}`)
```

### updateActiveImage

Update the active image with new `ImageData`.

```typescript
workspace.updateActiveImage(imageData: ImageData): Promise<void>
```

**Example:**

```typescript
const imageData = await workspace.getActiveImage()
if (!imageData) return

// Modify the image (example: invert colors)
const { data } = imageData
for (let i = 0; i < data.length; i += 4) {
  data[i] = 255 - data[i]       // R
  data[i + 1] = 255 - data[i + 1] // G
  data[i + 2] = 255 - data[i + 2] // B
  // data[i + 3] is alpha, leave unchanged
}

await workspace.updateActiveImage(imageData)
```

### getSelection

Get the current selection rectangle (relative to original image coordinates).

```typescript
workspace.getSelection(): Promise<SelectionRect | null>

interface SelectionRect {
  x: number
  y: number
  width: number
  height: number
}
```

Returns `null` if no selection is active.

**Example:**

```typescript
const selection = await workspace.getSelection()
if (selection) {
  console.log(`Selection: ${selection.width}x${selection.height} at (${selection.x}, ${selection.y})`)
}
```

### clearSelection

Clear the current selection.

```typescript
workspace.clearSelection(): Promise<void>
```

**Example:**

```typescript
await workspace.clearSelection()
```

## tabs

APIs for interacting with open tabs and their metadata.

### getActive

Get the currently active tab metadata.

```typescript
tabs.getActive(): Promise<TabMetadata | undefined>

interface TabMetadata {
  /** Unique tab identifier */
  readonly id: string
  /** Tab display name */
  readonly name: string
  /** File path if the tab represents a file */
  readonly filePath?: string
  /** Whether the tab has unsaved changes */
  readonly isDirty: boolean
}
```

Returns `undefined` if no tab is open.

**Example:**

```typescript
const activeTab = await tabs.getActive()
if (activeTab) {
  console.log(`Current tab: ${activeTab.name}`)
  
  // Use the filename for exports
  const baseName = activeTab.name.replace(/\.[^.]+$/, '') || 'image'
  await window.saveFile({ 
    filename: `${baseName}.ico`, 
    data: processedData 
  })
}
```

### getAll

Get metadata for all open tabs.

```typescript
tabs.getAll(): Promise<readonly TabMetadata[]>
```

**Example:**

```typescript
const allTabs = await tabs.getAll()
console.log(`${allTabs.length} tabs open`)

for (const tab of allTabs) {
  console.log(`- ${tab.name} ${tab.isDirty ? '(modified)' : ''}`)
}
```

## Disposable

Resource that can be disposed.

```typescript
interface Disposable {
  dispose(): void
}
```

All registered commands and other resources return `Disposable` objects. Add them to `context.subscriptions` for automatic cleanup when your plugin is deactivated.

## Plugin Manifest

### PluginManifest

```typescript
interface PluginManifest {
  id: string
  name: string
  version: string
  description: string
  main: string
  contributes?: {
    commands?: CommandContribution[]
    menus?: MenuContributions
  }
  permissions?: ('fetch')[]
  host_permissions?: string[]
}
```

### CommandContribution

```typescript
interface CommandContribution {
  command: string
  title: string
  enablement?: string
}
```

The `enablement` field accepts condition expressions. Currently supported:

- `hasActiveTab` - True when an image is open

### MenuContributions

```typescript
type MenuContributions = Record<'tools', MenuContribution[]>

interface MenuContribution {
  command: string
}
```

### Permissions

- `fetch` - Allows the plugin to make network requests

When using `fetch`, you must also specify `host_permissions` with URL patterns:

```json
{
  "permissions": ["fetch"],
  "host_permissions": [
    "https://api.example.com/*",
    "https://*.githubusercontent.com/*"
  ]
}
```

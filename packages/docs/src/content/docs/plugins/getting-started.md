---
title: Plugin Development
description: Learn how to create plugins for Pixra.
---

Pixra plugins are written in TypeScript and run in isolated Web Workers for security. This guide will walk you through creating your first plugin.

## Prerequisites

- Node.js 24+
- pnpm (recommended) or npm

## Creating a Plugin

The easiest way to create a new plugin is using the CLI:

```bash
# Create a new plugin
pnpm dlx @pixra/plugin-cli init my-plugin

# Navigate to the plugin directory
cd my-plugin

# Install dependencies
pnpm install
```

This creates a plugin with the following structure:

```
my-plugin/
├── plugin.json        # Plugin manifest
├── package.json       # Node.js package config
├── tsconfig.json      # TypeScript config
├── src/
│   └── main.ts        # Plugin entry point
└── .gitignore
```

## Plugin Structure

### plugin.json

The manifest file defines your plugin's metadata and contributions:

```json
{
  "id": "example.my-plugin",
  "name": "My Plugin",
  "description": "A description of what your plugin does",
  "main": "plugin.js",
  "contributes": {
    "commands": [
      {
        "command": "example.my-plugin.hello",
        "title": "My Plugin: Hello"
      }
    ],
    "menus": {
      "tools": [
        {
          "command": "example.my-plugin.hello"
        }
      ]
    }
  }
}
```

### src/main.ts

The entry point exports `activate` and optionally `deactivate` functions:

```typescript
import { commands, window, workspace, tabs, ExtensionContext } from '@pixra/plugin-sdk'

export function activate(context: ExtensionContext) {
  // Register command handlers
  context.subscriptions.push(
    commands.registerCommand('example.my-plugin.hello', async () => {
      // Get information about the current tab
      const activeTab = await tabs.getActive()
      
      if (activeTab) {
        await window.showInformationMessage(
          `Hello! Current file: ${activeTab.name}`
        )
      } else {
        await window.showInformationMessage('Hello from My Plugin!')
      }
    })
  )
}

export function deactivate() {
  // Cleanup (optional)
}
```

## Development Workflow

### Start Development Mode

```bash
pnpm dev
```

This watches for changes and automatically rebuilds and packages your plugin.

### Build for Production

```bash
pnpm build
```

### Create Distribution ZIP

```bash
pnpm zip
```

This creates a `.zip` file ready for distribution.

## Testing Your Plugin

1. Run `pnpm dev` to build and watch for changes
2. In Pixra, go to **Plugin > Install Plugin from ZIP**
3. Select the generated `.zip` file from your plugin's directory
4. Your plugin's commands will now appear in the Tools menu

## Example: Export with Original Filename

Here's a complete example showing how to use the tabs API to export files with a filename based on the original image:

```typescript
import { commands, window, workspace, tabs, ExtensionContext } from '@pixra/plugin-sdk'

async function exportAsText() {
  const imageData = await workspace.getActiveImage()
  if (!imageData) {
    await window.showErrorMessage('No image is currently open')
    return
  }

  // Get the original filename from the active tab
  const activeTab = await tabs.getActive()
  const baseName = activeTab?.name.replace(/\.[^.]+$/, '') || 'image'
  const filename = `${baseName}-metadata.txt`

  // Create text content
  const text = `Image Metadata
Width: ${imageData.width}px
Height: ${imageData.height}px
Tab: ${activeTab?.name || 'Untitled'}
Modified: ${activeTab?.isDirty ? 'Yes' : 'No'}
`

  // Save as text file
  const encoder = new TextEncoder()
  const data = encoder.encode(text).buffer

  await window.saveFile({ filename, data })
  await window.showInformationMessage('Metadata exported!')
}

export function activate(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand('example.exportMetadata', exportAsText)
  )
}
```

This pattern is useful for any export plugin that should preserve the original filename (e.g., converting `photo.png` to `photo.ico`).

## Next Steps

- [API Reference](/docs/plugins/api-reference/) - Complete API documentation
- [CLI Reference](/docs/plugins/cli-reference/) - CLI commands and options
- [Publishing Plugins](/docs/plugins/publishing/) - Share your plugin with others

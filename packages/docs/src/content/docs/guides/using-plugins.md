---
title: Using Plugins
description: Learn how to install and manage Pixra plugins.
---

Plugins extend Pixra's functionality with additional features like background removal, smart cropping, and more.

## Installing Plugins

### From Plugin Store

1. Click **Plugin > Plugin Store** or run the `Open Plugin Store` command
2. Browse available plugins
3. Click **Install** on the plugin you want

### From ZIP File

1. Click **Plugin > Install Plugin from ZIP** or run the `Install Plugin from ZIP` command
2. Select a `.zip` plugin file from your computer
3. The plugin will be installed and ready to use

## Using Plugins

Once installed, plugins add new commands to Pixra. You can access them via:

- **Tools menu**: Most plugins add their commands here
- **Command Palette**: Press `Ctrl+Shift+P` / `Cmd+Shift+P` and search for the plugin command

## Managing Plugins

### Viewing Installed Plugins

Open the Plugin Store to see all installed plugins and their status.

### Uninstalling Plugins

To remove a plugin, find it in the Plugin Store and click **Uninstall**.

## Available Plugins

### Remove Background

Uses AI to automatically remove image backgrounds. Runs entirely in your browser using WebGPU/WASM.

### Icon Crop

Removes transparent edges from images and crops to a perfect square, ideal for preparing app icons.

### Chrome Icons

Exports images as Chrome extension icon sets with all required sizes.

## Plugin Permissions

Some plugins require additional permissions:

- **fetch**: Allows the plugin to make network requests to specified hosts

When installing a plugin, you'll be notified of any permissions it requires.

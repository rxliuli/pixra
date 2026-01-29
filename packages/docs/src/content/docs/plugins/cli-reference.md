---
title: CLI Reference
description: Command reference for the Pixra plugin CLI.
---

The `@pixra/plugin-cli` package provides commands for building, developing, and packaging plugins.

## Installation

```bash
# Use pnpm dlx (recommended)
pnpm dlx @pixra/plugin-cli <command>

# Or add as dev dependency
pnpm i -D @pixra/plugin-cli
```

## Commands

### pixra init

Create a new plugin from template.

```bash
pixra init <directory>
```

**Arguments:**

- `<directory>` - Name of the directory to create

**Example:**

```bash
pixra init my-awesome-plugin
```

This creates a new plugin with:

- `plugin.json` - Manifest with a sample command and menu entry
- `package.json` - Pre-configured with dependencies
- `tsconfig.json` - TypeScript configuration
- `src/main.ts` - Entry point with example code
- `.gitignore` - Git ignore file

The plugin ID is automatically generated as `example.<directory-name>`.

### pixra build

Build the plugin for production.

```bash
pixra build
```

**Example:**

```bash
pixra build
```

The build process:

1. Validates `plugin.json`
2. Bundles `src/main.ts` with esbuild
3. Generates source maps
4. Outputs `plugin.json` and `plugin.js` to the output directory

### pixra dev

Start development mode with file watching.

```bash
pixra dev
```

**Example:**

```bash
pixra dev
```

Development mode:

1. Builds the plugin
2. Automatically creates a `.zip` file
3. Watches for file changes
4. Rebuilds and re-packages on changes

### pixra zip

Build and package the plugin as a ZIP file.

```bash
pixra zip
```

**Example:**

```bash
pixra zip
```

Creates a ZIP file named `<plugin-id>-<version>.zip` containing:

- `plugin.json`
- `plugin.js`
- `plugin.js.map`

## package.json Scripts

The generated `package.json` includes these scripts:

```json
{
  "scripts": {
    "dev": "pixra dev",
    "build": "pixra build",
    "zip": "pixra zip",
    "prepublishOnly": "pnpm build"
  }
}
```

Usage:

```bash
pnpm dev      # Start development mode
pnpm build    # Build for production
pnpm zip      # Create distribution ZIP
```

## Build Configuration

The CLI uses [esbuild](https://esbuild.github.io/) with the following configuration:

- **Platform**: `browser`
- **Format**: `esm` (ES Modules)
- **Target**: `es2020`
- **External**: `@pixra/plugin-sdk` (provided by Pixra at runtime)
- **Minify**: Disabled (for debugging)
- **Sourcemaps**: Enabled

## Entry Points

The CLI looks for entry files in this order:

1. `src/main.ts`
2. `src/main.js`

## Output Structure

After building:

```
dist/
├── plugin.json    # Manifest with version from package.json
├── plugin.js      # Bundled plugin code
└── plugin.js.map  # Source map
```

After zipping:

```
example.my-plugin-0.0.1.zip
├── plugin.json
├── plugin.js
└── plugin.js.map
```

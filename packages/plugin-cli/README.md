# @pixra/plugin-cli

CLI tool for building and packaging Pixra plugins.

## Installation

```bash
pnpm i -D @pixra/plugin-cli
```

## Usage

```bash
# Build plugin
pixra-plugin build

# Package plugin into ZIP
pixra-plugin zip

# Development mode with watch
pixra-plugin dev
```

## Commands

### `build`

Compiles the plugin source code. Automatically detects TypeScript or JavaScript files.

### `zip`

Creates a ZIP file containing the plugin manifest, compiled code, and README.

### `dev`

Runs in watch mode, automatically rebuilding when source files change.

# Hello World Plugin

A simple example plugin for Pixra that demonstrates basic plugin functionality.

## Features

- Registers a "Hello World" command
- Shows an information message when executed

## Usage

1. Install the plugin in Pixra
2. Open the command palette (Help > Show All Commands)
3. Search for "Hello World"
4. Execute the command to see the greeting

## Development

This plugin serves as a template for creating Pixra plugins. Key files:

- `manifest.json` - Plugin metadata and contributions
- `src/main.js` - Plugin implementation
- `package.json` - npm package configuration

## Building

```bash
npm run build
npm run package
```

This will create a `hello-world.zip` file that can be installed in Pixra.

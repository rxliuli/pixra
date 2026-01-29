---
title: Publishing Plugins
description: Learn how to publish and distribute your Pixra plugins.
---

Once your plugin is ready, you can share it with others by publishing to npm. Plugins published to npm automatically appear in Pixra's Plugin Store.

## Preparing for Publication

### 1. Update package.json

Ensure your `package.json` is properly configured:

```json
{
  "name": "your-plugin-name",
  "version": "1.0.0",
  "description": "A clear description of what your plugin does",
  "keywords": ["pixra-plugin"],
  "license": "MIT",
  "files": ["dist"],
  "publishConfig": {
    "access": "public"
  }
}
```

Important fields:

- **name**: Your npm package name (doesn't need to match plugin ID)
- **keywords**: Must include `"pixra-plugin"` for Plugin Store discovery
- **files**: Should include `"dist"` to publish only built files
- **publishConfig.access**: Set to `"public"` for public packages

### 2. Update plugin.json

Make sure your plugin manifest has accurate information:

```json
{
  "id": "your-namespace.plugin-name",
  "name": "Plugin Display Name",
  "description": "What your plugin does"
}
```

The `version` field in `plugin.json` is automatically populated from `package.json` during build.

### 3. Build Your Plugin

```bash
pnpm build
```

Verify the `dist/` folder contains:

- `plugin.json`
- `plugin.js`
- `plugin.js.map`

## Publishing to npm

### First-Time Setup

If you haven't published to npm before:

```bash
# Create an npm account at https://www.npmjs.com/
# Then login
pnpm login
```

### Publish

```bash
pnpm publish
```

The `prepublishOnly` script automatically runs `pnpm build` before publishing.

### Updating Your Plugin

1. Update your code
2. Bump the version in `package.json`:

```bash
pnpm version patch  # 1.0.0 -> 1.0.1
pnpm version minor  # 1.0.0 -> 1.1.0
pnpm version major  # 1.0.0 -> 2.0.0
```

3. Publish the new version:

```bash
pnpm publish
```

## Plugin Store Discovery

The Pixra Plugin Store automatically discovers plugins from npm using the `pixra-plugin` keyword. After publishing:

1. Your plugin will appear in the Plugin Store
2. Users can install it directly from within Pixra
3. Updates are automatically available when you publish new versions

## Manual Distribution

You can also distribute plugins as ZIP files:

```bash
pnpm zip
```

This creates a `.zip` file that users can install via **Plugin > Install Plugin from ZIP** in Pixra.

## Best Practices

### Versioning

Follow [Semantic Versioning](https://semver.org/):

- **Patch** (1.0.x): Bug fixes, no breaking changes
- **Minor** (1.x.0): New features, backwards compatible
- **Major** (x.0.0): Breaking changes

### Documentation

Include a README.md in your repository with:

- What the plugin does
- Installation instructions
- Usage examples
- Screenshots (if applicable)

### Changelog

Maintain a CHANGELOG.md to document changes between versions.

### Testing

Before publishing:

1. Test your plugin thoroughly in Pixra
2. Verify all commands work as expected
3. Check permissions and host_permissions are correct

## Example: Complete package.json

```json
{
  "name": "@myorg/pixra-awesome-plugin",
  "version": "1.0.0",
  "description": "An awesome plugin that does amazing things",
  "keywords": ["pixra-plugin", "image-processing"],
  "author": "Your Name <you@example.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/myorg/pixra-awesome-plugin"
  },
  "homepage": "https://github.com/myorg/pixra-awesome-plugin#readme",
  "bugs": {
    "url": "https://github.com/myorg/pixra-awesome-plugin/issues"
  },
  "type": "module",
  "files": ["dist"],
  "publishConfig": {
    "access": "public"
  },
  "scripts": {
    "dev": "pixra dev",
    "build": "pixra build",
    "zip": "pixra zip",
    "prepublishOnly": "pnpm build"
  },
  "devDependencies": {
    "@pixra/plugin-cli": "^0.0.1",
    "@pixra/plugin-sdk": "^0.0.1",
    "typescript": "^5.7.0"
  }
}
```

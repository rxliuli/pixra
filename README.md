# Pixra

An open-source, extensible web-based image editor.

**Try it now:** <https://pixra.rxliuli.com/>

**Documentation:** <https://pixra.rxliuli.com/docs/>

## Features

- Basic image editing: crop, resize, brush, marquee selection
- Multi-tab support
- Undo/redo history
- Export to PNG, JPEG, WEBP
- Plugin system for custom tools

## Getting Started

```bash
pnpm install
pnpm dev
```

## Plugin Development

See the [documentation](https://pixra.rxliuli.com/docs/) for guides on how to create and integrate plugins.

## License

This project is licensed under AGPL-3.0. However, the plugin SDK (`packages/plugin-sdk`) and CLI (`packages/plugin-cli`) are licensed under MIT, so you can develop and distribute plugins without AGPL restrictions.

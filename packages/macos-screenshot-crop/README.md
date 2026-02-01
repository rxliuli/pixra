# macOS Screenshot Crop

A Pixra plugin that removes the rounded corners from macOS window screenshots, making them transparent.

## Problem

When you take a screenshot of a window on macOS, the four corners include whatever is behind the window. This plugin detects the corner radius and crops those areas to transparent.

## Usage

1. Open a macOS window screenshot in Pixra
2. Run "macOS Screenshot Crop" from the Tools menu
3. Export as PNG to preserve transparency

## How it works

The plugin scans the image edges to detect where the window border begins, calculates the corner radius, and applies a circular mask to each corner.

## Limitations

- Works best when the window border color differs from the background
- Detection may be slightly larger than the actual radius in some cases

## Install

```bash
pnpm add @pixra/macos-screenshot-crop
```

Or download the zip from releases and install manually in Pixra.

# macOS Screenshot Crop

A Pixra plugin that removes the rounded corners from macOS window screenshots, making them transparent.

## Problem

When you take a screenshot of a window on macOS, the four corners include whatever is behind the window (the shadow area contains the background). This plugin crops those corner areas to transparent.

## Usage

1. Open a macOS window screenshot in Pixra
2. Run "macOS Screenshot Crop" from the Tools menu
3. Export as PNG to preserve transparency

## How it works

The plugin applies a fixed 45px radius circular mask to all four corners of the image. For each corner:

1. Pixels outside the circular boundary are made fully transparent (alpha = 0)
2. Anti-aliasing is applied at the edge for smooth transitions

The 45px radius is calibrated to cover the macOS window corner radius including the shadow area.

## Install

1. Open <https://pixra.rxliuli.com/>
2. Click **Plugin** > **Plugin Store**
3. Find "macOS Screenshot Crop" and install it

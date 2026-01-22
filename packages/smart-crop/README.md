# Smart Crop

A Pixra plugin that trims transparent edges from images.

## What it does

Scans the image to find the bounding box of non-transparent pixels, then crops to that region. Useful for cleaning up exported sprites, icons, or any image with unwanted transparent margins.

A small padding (2px) is preserved around the content to prevent edge clipping.

## Usage

1. Open an image with transparent edges in Pixra
2. Run "Smart Crop" from the Tools menu
3. The image is cropped to its content bounds

## Notes

- Pixels with alpha below 10 are treated as transparent
- If the image has no transparent edges, nothing happens
- Fully transparent images cannot be cropped

## License

AGPL-3.0

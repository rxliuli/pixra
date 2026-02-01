/**
 * macOS Screenshot Crop Plugin for Pixra
 *
 * Automatically detects macOS screenshot window rounded corners
 * and makes them transparent.
 */

import * as pixra from '@pixra/plugin-sdk'

/** Maximum corner radius to search for */
const MAX_CORNER_RADIUS = 50

/** Minimum corner radius to consider valid */
const MIN_CORNER_RADIUS = 5

/** Color difference threshold for edge detection */
const COLOR_DIFF_THRESHOLD = 30

interface Corner {
  type: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'
  originX: number
  originY: number
  radius: number
}

/**
 * Get pixel color at (x, y)
 */
function getPixel(
  data: Uint8ClampedArray,
  width: number,
  x: number,
  y: number,
): [number, number, number, number] {
  const idx = (y * width + x) * 4
  return [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]]
}

/**
 * Calculate color difference between two pixels
 */
function colorDiff(
  c1: [number, number, number, number],
  c2: [number, number, number, number],
): number {
  const dr = c1[0] - c2[0]
  const dg = c1[1] - c2[1]
  const db = c1[2] - c2[2]
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

/**
 * Detect corner radius by finding where the window border begins.
 *
 * Key insight: The window border/titlebar has a uniform color.
 * We scan along the image edge and find where consecutive pixels
 * start having the same color (indicating the window border).
 */
function detectCornerRadius(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  cornerType: Corner['type'],
): number | null {
  const maxRadius = Math.min(MAX_CORNER_RADIUS, width / 4, height / 4)

  // Determine corner position and scan direction
  let cornerX: number, cornerY: number
  let dirX: number, dirY: number

  switch (cornerType) {
    case 'topLeft':
      cornerX = 0
      cornerY = 0
      dirX = 1
      dirY = 1
      break
    case 'topRight':
      cornerX = width - 1
      cornerY = 0
      dirX = -1
      dirY = 1
      break
    case 'bottomLeft':
      cornerX = 0
      cornerY = height - 1
      dirX = 1
      dirY = -1
      break
    case 'bottomRight':
      cornerX = width - 1
      cornerY = height - 1
      dirX = -1
      dirY = -1
      break
  }

  // Method: Scan along the edge and find where pixels become uniform
  // (indicating we've entered the window border area)

  // Get the border color by sampling a point that's definitely inside the window border
  // This is at the edge but past the corner radius
  const borderSampleX = cornerType === 'topLeft' || cornerType === 'bottomLeft'
    ? Math.min(width - 1, maxRadius * 2)
    : Math.max(0, width - 1 - maxRadius * 2)
  const borderSampleY = cornerType === 'topLeft' || cornerType === 'topRight' ? 0 : height - 1
  const borderColor = getPixel(data, width, borderSampleX, borderSampleY)

  // Scan along x-axis at the corner's y position
  // Find the first pixel that matches the border color
  let radiusFromX: number | null = null
  for (let offset = 0; offset < maxRadius; offset++) {
    const x = cornerX + dirX * offset
    const y = cornerY
    if (x < 0 || x >= width) break

    const color = getPixel(data, width, x, y)
    if (colorDiff(color, borderColor) < COLOR_DIFF_THRESHOLD) {
      radiusFromX = offset
      break
    }
  }

  // Get the border color for vertical edge
  const borderSampleX2 = cornerType === 'topLeft' || cornerType === 'bottomLeft' ? 0 : width - 1
  const borderSampleY2 = cornerType === 'topLeft' || cornerType === 'topRight'
    ? Math.min(height - 1, maxRadius * 2)
    : Math.max(0, height - 1 - maxRadius * 2)
  const borderColor2 = getPixel(data, width, borderSampleX2, borderSampleY2)

  // Scan along y-axis at the corner's x position
  let radiusFromY: number | null = null
  for (let offset = 0; offset < maxRadius; offset++) {
    const x = cornerX
    const y = cornerY + dirY * offset
    if (y < 0 || y >= height) break

    const color = getPixel(data, width, x, y)
    if (colorDiff(color, borderColor2) < COLOR_DIFF_THRESHOLD) {
      radiusFromY = offset
      break
    }
  }

  // Use the average of both measurements if both are valid
  if (radiusFromX !== null && radiusFromY !== null) {
    const avg = (radiusFromX + radiusFromY) / 2
    if (avg >= MIN_CORNER_RADIUS && avg <= MAX_CORNER_RADIUS) {
      return avg
    }
  } else if (radiusFromX !== null && radiusFromX >= MIN_CORNER_RADIUS) {
    return radiusFromX
  } else if (radiusFromY !== null && radiusFromY >= MIN_CORNER_RADIUS) {
    return radiusFromY
  }

  return null
}

/**
 * Detect corner for a specific corner type
 */
function detectCorner(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  cornerType: Corner['type'],
): Corner | null {
  const radius = detectCornerRadius(data, width, height, cornerType)

  if (!radius) {
    return null
  }

  // Determine origin (center of the circle)
  let originX: number, originY: number
  switch (cornerType) {
    case 'topLeft':
      originX = radius
      originY = radius
      break
    case 'topRight':
      originX = width - radius
      originY = radius
      break
    case 'bottomLeft':
      originX = radius
      originY = height - radius
      break
    case 'bottomRight':
      originX = width - radius
      originY = height - radius
      break
  }

  return {
    type: cornerType,
    originX,
    originY,
    radius,
  }
}

/**
 * Make pixels outside the rounded corner transparent
 */
function applyCornerMask(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  corner: Corner,
): void {
  const { type, originX, originY, radius } = corner

  // Determine the corner region to process
  let startX: number, endX: number, startY: number, endY: number

  switch (type) {
    case 'topLeft':
      startX = 0
      endX = Math.ceil(radius)
      startY = 0
      endY = Math.ceil(radius)
      break
    case 'topRight':
      startX = Math.floor(width - radius)
      endX = width
      startY = 0
      endY = Math.ceil(radius)
      break
    case 'bottomLeft':
      startX = 0
      endX = Math.ceil(radius)
      startY = Math.floor(height - radius)
      endY = height
      break
    case 'bottomRight':
      startX = Math.floor(width - radius)
      endX = width
      startY = Math.floor(height - radius)
      endY = height
      break
  }

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const dx = x - originX
      const dy = y - originY
      const distSquared = dx * dx + dy * dy
      const radiusSquared = radius * radius

      if (distSquared > radiusSquared) {
        // Outside the circle - make transparent
        const idx = (y * width + x) * 4
        data[idx + 3] = 0 // Set alpha to 0
      } else if (distSquared > (radius - 1) * (radius - 1)) {
        // Anti-aliasing: blend at the edge
        const dist = Math.sqrt(distSquared)
        const alpha = Math.max(0, Math.min(1, radius - dist))
        const idx = (y * width + x) * 4
        data[idx + 3] = Math.round(data[idx + 3] * alpha)
      }
    }
  }
}

/**
 * Create corner with unified radius
 */
function createCorner(
  cornerType: Corner['type'],
  radius: number,
  width: number,
  height: number,
): Corner {
  let originX: number, originY: number
  switch (cornerType) {
    case 'topLeft':
      originX = radius
      originY = radius
      break
    case 'topRight':
      originX = width - radius
      originY = radius
      break
    case 'bottomLeft':
      originX = radius
      originY = height - radius
      break
    case 'bottomRight':
      originX = width - radius
      originY = height - radius
      break
  }
  return { type: cornerType, originX, originY, radius }
}

/**
 * Main function to crop macOS screenshot corners
 */
async function cropMacOSScreenshot(): Promise<void> {
  const imageData = await pixra.workspace.getActiveImage()
  if (!imageData) {
    await pixra.window.showErrorMessage('No image is currently open')
    return
  }

  const { width, height, data } = imageData

  // Detect all four corners
  const detectedCorners: (Corner | null)[] = [
    detectCorner(data, width, height, 'topLeft'),
    detectCorner(data, width, height, 'topRight'),
    detectCorner(data, width, height, 'bottomLeft'),
    detectCorner(data, width, height, 'bottomRight'),
  ]

  const validDetections = detectedCorners.filter((c): c is Corner => c !== null)

  if (validDetections.length === 0) {
    await pixra.window.showWarningMessage(
      'Could not detect rounded corners. Make sure this is a macOS window screenshot.',
    )
    return
  }

  // Use median radius for all corners (macOS windows have uniform corner radius)
  const radii = validDetections.map((c) => c.radius).sort((a, b) => a - b)
  const medianRadius = radii[Math.floor(radii.length / 2)]

  // Create corners with unified radius
  const cornerTypes: Corner['type'][] = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight']
  const corners = cornerTypes.map((type) => createCorner(type, medianRadius, width, height))

  // Create a copy of the image data
  const newData = new Uint8ClampedArray(data)

  // Apply masks to all four corners
  for (const corner of corners) {
    applyCornerMask(newData, width, height, corner)
  }

  const newImageData = new ImageData(newData, width, height)
  await pixra.workspace.updateActiveImage(newImageData)

  await pixra.window.showInformationMessage(
    `Processed 4 corners with unified radius: ${Math.round(medianRadius)}px (detected: ${validDetections.map((c) => Math.round(c.radius)).join(', ')}px)`,
  )
}

/**
 * Plugin activation
 */
export function activate(context: pixra.ExtensionContext) {
  const disposable = pixra.commands.registerCommand(
    'macos-screenshot-crop.crop',
    cropMacOSScreenshot,
  )
  context.subscriptions.push(disposable)
}

/**
 * Plugin deactivation
 */
export function deactivate() {
  // Nothing to clean up
}

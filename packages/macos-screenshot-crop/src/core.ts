/**
 * Core corner masking functions
 * This file contains pure functions with no external dependencies
 */

export interface Corner {
  type: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'
  originX: number
  originY: number
  radius: number
}

/**
 * Get pixel color at (x, y)
 */
export function getPixel(
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
export function colorDiff(
  c1: [number, number, number, number],
  c2: [number, number, number, number],
): number {
  const dr = c1[0] - c2[0]
  const dg = c1[1] - c2[1]
  const db = c1[2] - c2[2]
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

/**
 * Make pixels outside the rounded corner transparent
 */
export function applyCornerMask(
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
 * Create corner with specified radius
 */
export function createCorner(
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
 * Process image data to crop rounded corners
 */
export function processCorners(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number,
): Uint8ClampedArray<ArrayBuffer> {
  const cornerTypes: Corner['type'][] = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight']
  const corners = cornerTypes.map((type) => createCorner(type, radius, width, height))

  const newData = new Uint8ClampedArray(data.length)
  newData.set(data)
  for (const corner of corners) {
    applyCornerMask(newData, width, height, corner)
  }

  return newData
}

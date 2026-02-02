import { describe, it, expect } from 'vitest'
import { getPixel, colorDiff, applyCornerMask, createCorner, processCorners, Corner } from './core'

/**
 * Load an image from a URL and return its ImageData
 */
async function loadImageData(url: string): Promise<ImageData> {
  const response = await fetch(url)
  const blob = await response.blob()
  const bitmap = await createImageBitmap(blob)

  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0)

  return ctx.getImageData(0, 0, canvas.width, canvas.height)
}

describe('core functions', () => {
  describe('getPixel', () => {
    it('should get pixel at correct position', () => {
      const data = new Uint8ClampedArray([
        255, 0, 0, 255, // (0,0) red
        0, 255, 0, 255, // (1,0) green
        0, 0, 255, 255, // (0,1) blue
        255, 255, 0, 255, // (1,1) yellow
      ])

      expect(getPixel(data, 2, 0, 0)).toEqual([255, 0, 0, 255])
      expect(getPixel(data, 2, 1, 0)).toEqual([0, 255, 0, 255])
      expect(getPixel(data, 2, 0, 1)).toEqual([0, 0, 255, 255])
      expect(getPixel(data, 2, 1, 1)).toEqual([255, 255, 0, 255])
    })
  })

  describe('colorDiff', () => {
    it('should return 0 for identical colors', () => {
      const color: [number, number, number, number] = [100, 150, 200, 255]
      expect(colorDiff(color, color)).toBe(0)
    })

    it('should calculate correct difference', () => {
      const c1: [number, number, number, number] = [0, 0, 0, 255]
      const c2: [number, number, number, number] = [255, 255, 255, 255]
      expect(colorDiff(c1, c2)).toBeCloseTo(441.67, 1)
    })
  })

  describe('createCorner', () => {
    it('should create topLeft corner correctly', () => {
      const corner = createCorner('topLeft', 10, 100, 100)
      expect(corner).toEqual({
        type: 'topLeft',
        originX: 10,
        originY: 10,
        radius: 10,
      })
    })

    it('should create topRight corner correctly', () => {
      const corner = createCorner('topRight', 10, 100, 100)
      expect(corner).toEqual({
        type: 'topRight',
        originX: 90,
        originY: 10,
        radius: 10,
      })
    })

    it('should create bottomLeft corner correctly', () => {
      const corner = createCorner('bottomLeft', 10, 100, 100)
      expect(corner).toEqual({
        type: 'bottomLeft',
        originX: 10,
        originY: 90,
        radius: 10,
      })
    })

    it('should create bottomRight corner correctly', () => {
      const corner = createCorner('bottomRight', 10, 100, 100)
      expect(corner).toEqual({
        type: 'bottomRight',
        originX: 90,
        originY: 90,
        radius: 10,
      })
    })
  })

  describe('applyCornerMask', () => {
    it('should make corner pixels transparent', () => {
      const width = 10
      const height = 10
      const data = new Uint8ClampedArray(width * height * 4)
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255
        data[i + 1] = 255
        data[i + 2] = 255
        data[i + 3] = 255
      }

      const corner: Corner = {
        type: 'topLeft',
        originX: 5,
        originY: 5,
        radius: 5,
      }

      applyCornerMask(data, width, height, corner)

      const [, , , alpha00] = getPixel(data, width, 0, 0)
      expect(alpha00).toBe(0)

      const [, , , alpha44] = getPixel(data, width, 4, 4)
      expect(alpha44).toBe(255)
    })
  })

  describe('processCorners', () => {
    it('should process all four corners', () => {
      const width = 100
      const height = 100
      const data = new Uint8ClampedArray(width * height * 4)
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255
        data[i + 1] = 255
        data[i + 2] = 255
        data[i + 3] = 255
      }

      const result = processCorners(data, width, height, 10)

      // All four corners should be transparent
      expect(getPixel(result, width, 0, 0)[3]).toBe(0)
      expect(getPixel(result, width, 99, 0)[3]).toBe(0)
      expect(getPixel(result, width, 0, 99)[3]).toBe(0)
      expect(getPixel(result, width, 99, 99)[3]).toBe(0)

      // Center should be opaque
      expect(getPixel(result, width, 50, 50)[3]).toBe(255)
    })
  })
})

describe('corner processing with real images', () => {
  it('should process screenshot 1 with 45px radius', async () => {
    const imageData = await loadImageData(
      new URL('./assets/Snipaste_2026-02-01_20-46-27.png', import.meta.url).href,
    )

    const { width, height, data } = imageData
    const result = processCorners(data, width, height, 45)

    // Corners should be transparent
    expect(getPixel(result, width, 0, 0)[3]).toBe(0)
    expect(getPixel(result, width, width - 1, 0)[3]).toBe(0)
    expect(getPixel(result, width, 0, height - 1)[3]).toBe(0)
    expect(getPixel(result, width, width - 1, height - 1)[3]).toBe(0)
  })

  it('should process screenshot 2 with 45px radius', async () => {
    const imageData = await loadImageData(
      new URL('./assets/Snipaste_2026-02-01_20-57-36.png', import.meta.url).href,
    )

    const { width, height, data } = imageData
    const result = processCorners(data, width, height, 45)

    // Corners should be transparent
    expect(getPixel(result, width, 0, 0)[3]).toBe(0)
    expect(getPixel(result, width, width - 1, 0)[3]).toBe(0)
    expect(getPixel(result, width, 0, height - 1)[3]).toBe(0)
    expect(getPixel(result, width, width - 1, height - 1)[3]).toBe(0)
  })
})

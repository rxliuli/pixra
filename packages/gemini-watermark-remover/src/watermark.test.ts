import { describe, it, expect } from 'vitest'
import { getWatermarkConfig, getAlphaMap, removeWatermark } from './watermark'

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

describe('getWatermarkConfig', () => {
  it('should return 48/32 for normal images', () => {
    expect(getWatermarkConfig(1344, 768)).toEqual({ logoSize: 48, margin: 32 })
    expect(getWatermarkConfig(1024, 1024)).toEqual({ logoSize: 48, margin: 32 })
    expect(getWatermarkConfig(864, 1184)).toEqual({ logoSize: 48, margin: 32 })
  })

  it('should return 96/64 for large images', () => {
    expect(getWatermarkConfig(2816, 1536)).toEqual({ logoSize: 96, margin: 64 })
    expect(getWatermarkConfig(1536, 2816)).toEqual({ logoSize: 96, margin: 64 })
    expect(getWatermarkConfig(2001, 1000)).toEqual({ logoSize: 96, margin: 64 })
  })

  it('should return 48/32 for boundary case', () => {
    expect(getWatermarkConfig(2000, 2000)).toEqual({ logoSize: 48, margin: 32 })
  })
})

describe('removeWatermark', () => {
  it('should recover original pixels from synthetic alpha blend', async () => {
    const size = 48
    const alphaMap = await getAlphaMap(size)

    // Create a known "original" image region with color (100, 150, 200)
    const width = size
    const height = size
    const originalR = 100
    const originalG = 150
    const originalB = 200

    // Simulate alpha blending: blended = original * (1 - alpha) + 255 * alpha
    const blendedData = new Uint8ClampedArray(width * height * 4)
    for (let i = 0; i < size * size; i++) {
      const alpha = alphaMap[i]
      blendedData[i * 4] = Math.round(originalR * (1 - alpha) + 255 * alpha)
      blendedData[i * 4 + 1] = Math.round(originalG * (1 - alpha) + 255 * alpha)
      blendedData[i * 4 + 2] = Math.round(originalB * (1 - alpha) + 255 * alpha)
      blendedData[i * 4 + 3] = 255
    }

    const imageData = new ImageData(blendedData, width, height)
    removeWatermark(imageData, alphaMap, 0, 0, size)

    // Verify recovery: pixels with alpha > 0.01 should be close to original
    let maxError = 0
    for (let i = 0; i < size * size; i++) {
      const alpha = alphaMap[i]
      if (alpha < 0.01) continue
      const errR = Math.abs(imageData.data[i * 4] - originalR)
      const errG = Math.abs(imageData.data[i * 4 + 1] - originalG)
      const errB = Math.abs(imageData.data[i * 4 + 2] - originalB)
      maxError = Math.max(maxError, errR, errG, errB)
    }

    expect(maxError).toBeLessThan(5)
  })
})

describe('integration tests with real images', () => {
  it('should remove watermark from black image', async () => {
    const imageData = await loadImageData(
      new URL('./assets/Gemini_Generated_Image_qpx39oqpx39oqpx3.png', import.meta.url).href,
    )

    const { width, height } = imageData
    const { logoSize, margin } = getWatermarkConfig(width, height)
    const x = width - margin - logoSize
    const y = height - margin - logoSize
    const alphaMap = await getAlphaMap(logoSize)

    removeWatermark(imageData, alphaMap, x, y, logoSize)

    // Watermark area should now be close to black (0,0,0)
    let maxVal = 0
    for (let dy = 0; dy < logoSize; dy++) {
      for (let dx = 0; dx < logoSize; dx++) {
        const idx = ((y + dy) * width + (x + dx)) * 4
        maxVal = Math.max(maxVal, imageData.data[idx], imageData.data[idx + 1], imageData.data[idx + 2])
      }
    }

    expect(maxVal).toBeLessThan(5)
  })

  it('should modify watermark area and leave outside pixels unchanged in color image', async () => {
    const imageData = await loadImageData(
      new URL('./assets/Gemini_Generated_Image_8xwuyg8xwuyg8xwu.png', import.meta.url).href,
    )

    const { width, height } = imageData
    const { logoSize, margin } = getWatermarkConfig(width, height)
    const x = width - margin - logoSize
    const y = height - margin - logoSize
    const alphaMap = await getAlphaMap(logoSize)

    // Save pixels outside the watermark area for comparison
    const outsideIdx = (0 * width + 0) * 4
    const outsideR = imageData.data[outsideIdx]
    const outsideG = imageData.data[outsideIdx + 1]
    const outsideB = imageData.data[outsideIdx + 2]

    // Save some watermark center pixels before removal
    const centerDx = Math.floor(logoSize / 2)
    const centerDy = Math.floor(logoSize / 2)
    const centerIdx = ((y + centerDy) * width + (x + centerDx)) * 4
    const beforeR = imageData.data[centerIdx]
    const beforeG = imageData.data[centerIdx + 1]
    const beforeB = imageData.data[centerIdx + 2]

    removeWatermark(imageData, alphaMap, x, y, logoSize)

    // Outside pixels should be unchanged
    expect(imageData.data[outsideIdx]).toBe(outsideR)
    expect(imageData.data[outsideIdx + 1]).toBe(outsideG)
    expect(imageData.data[outsideIdx + 2]).toBe(outsideB)

    // Center watermark pixels should have changed
    const afterR = imageData.data[centerIdx]
    const afterG = imageData.data[centerIdx + 1]
    const afterB = imageData.data[centerIdx + 2]
    const changed = afterR !== beforeR || afterG !== beforeG || afterB !== beforeB
    expect(changed).toBe(true)
  })
})

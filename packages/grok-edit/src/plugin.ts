/**
 * Grok Image Edit Plugin for Pixra
 *
 * Allows AI-powered image editing using Grok AI's image generation API.
 */

import * as pixra from '@pixra/plugin-sdk'
import { fileReadAs } from './fileReadAs'

/**
 * Convert ImageData to base64 PNG string
 */
async function imageDataToBase64Url(imageData: ImageData): Promise<string> {
  const canvas = new OffscreenCanvas(imageData.width, imageData.height)
  const ctx = canvas.getContext('2d')!
  ctx.putImageData(imageData, 0, 0)
  const blob = await canvas.convertToBlob({ type: 'image/png' })

  // Use FileReader to get base64
  return fileReadAs(blob, 'dataURL')
}

/**
 * Convert base64 string to ImageData
 */
async function base64ToImageData(base64: string): Promise<ImageData> {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  const blob = new Blob([bytes], { type: 'image/png' })
  const bitmap = await createImageBitmap(blob)
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0)
  return ctx.getImageData(0, 0, bitmap.width, bitmap.height)
}

/**
 * Get prompt from user using input dialog
 */
async function getPrompt(): Promise<string | undefined> {
  return await pixra.window.showInputBox({
    title: 'AI Image Edit',
    prompt: 'Describe how you want to edit the image',
    placeholder:
      'e.g., Add a sunset background, Remove the person, Make it look vintage...',
  })
}

/**
 * Call OpenAI API to edit image
 */
async function editImageWithAI(
  imageBase64Url: string,
  prompt: string,
  apiKey: string,
  baseUrl: string,
  model: string,
): Promise<string> {
  const url = `${baseUrl}/images/edits`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      image: {
        url: imageBase64Url,
      },
      prompt: prompt,
      response_format: 'b64_json',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`API request failed: ${response.status} - ${error}`)
  }

  const result = await response.json()

  if (!result.data || !result.data[0] || !result.data[0].b64_json) {
    throw new Error('Invalid API response: missing image base64 data')
  }

  // Download the image from URL and convert to base64
  const imageBase64 = result.data[0].b64_json
  const imageResponse = await fetch(`data:image/png;base64,${imageBase64}`)
  if (!imageResponse.ok) {
    throw new Error(`Failed to download image: ${imageResponse.status}`)
  }

  const blob = await imageResponse.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * This function is called when the plugin is activated
 */
export function activate(context: pixra.ExtensionContext) {
  const disposable = pixra.commands.registerCommand(
    'grok-edit.editImage',
    async () => {
      try {
        // Get configuration
        const apiKey = await pixra.configuration.get<string>('grok-edit.apiKey')
        const baseUrl =
          await pixra.configuration.get<string>('grok-edit.baseUrl')
        const model = await pixra.configuration.get<string>('grok-edit.model')

        if (!apiKey) {
          await pixra.window.showErrorMessage(
            'Please configure your Grok AI API Key in plugin settings',
          )
          return
        }

        // Get current image
        const imageData = await pixra.workspace.getActiveImage()
        if (!imageData) {
          await pixra.window.showErrorMessage('No image is currently open')
          return
        }

        // Get prompt from user
        const prompt = await getPrompt()
        if (!prompt) {
          return // User cancelled
        }

        // Edit image with progress
        await pixra.window.withProgress(
          { title: 'Editing image with Grok AI...', cancellable: false },
          async (progress) => {
            progress.report({ message: 'Converting image...' })
            const imageBase64Url = await imageDataToBase64Url(imageData)

            progress.report({ message: 'Calling Grok API...' })
            const resultBase64 = await editImageWithAI(
              imageBase64Url,
              prompt,
              apiKey,
              baseUrl ?? 'https://api.x.ai/v1',
              model ?? 'grok-imagine-image',
            )

            progress.report({ message: 'Processing result...' })
            const resultImageData = await base64ToImageData(resultBase64)

            // Update the image
            await pixra.workspace.updateActiveImage(resultImageData)
          },
        )

        await pixra.window.showInformationMessage('Image edited successfully!')
      } catch (error) {
        await pixra.window.showErrorMessage(
          `Failed to edit image: ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    },
  )

  context.subscriptions.push(disposable)
}

/**
 * This function is called when the plugin is deactivated
 */
export function deactivate() {
  console.log('Grok Edit plugin is now deactivated')
}

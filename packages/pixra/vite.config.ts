import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import * as esbuild from 'esbuild'
import fs from 'fs/promises'

/**
 * Vite plugin to bundle TypeScript files as strings
 * Usage: import code from './file.ts?bundle'
 */
function bundlePlugin(): Plugin {
  return {
    name: 'bundle-import',
    async load(id) {
      if (id.endsWith('?bundle')) {
        const filePath = id.slice(0, -7) // Remove '?bundle'

        // Read the file
        const code = await fs.readFile(filePath, 'utf-8')

        // Bundle with esbuild
        const result = await esbuild.build({
          stdin: {
            contents: code,
            loader: 'ts',
            resolveDir: path.dirname(filePath),
            sourcefile: filePath,
          },
          bundle: true,
          format: 'esm', // Use ESM format so exports are preserved
          platform: 'browser',
          target: 'es2020',
          write: false,
          minify: false,
        })

        if (result.outputFiles && result.outputFiles.length > 0) {
          const bundledCode = new TextDecoder().decode(
            result.outputFiles[0].contents,
          )
          // Return as a default export string
          return `export default ${JSON.stringify(bundledCode)}`
        }

        throw new Error('esbuild produced no output')
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), bundlePlugin()],
  optimizeDeps: {
    // rembg-webgpu bundles a worker entry that can confuse Vite's dep optimizer in dev.
    exclude: ['rembg-webgpu'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        advancedChunks: {
          groups: [
            {
              name: 'huggingface-transformers',
              test: /@huggingface\/transformers/,
            },
          ],
        },
      },
    },
  },
})

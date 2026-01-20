import esbuild from 'esbuild'
import fs from 'fs'
import path from 'path'
import { logger } from '../utils/logger.js'
import { findManifest, validateManifest } from '../utils/manifest.js'
import { findEntry } from '../utils/files.js'

interface BuildOptions {
  outDir: string
}

export async function build(options: BuildOptions) {
  const cwd = process.cwd()
  
  // Validate manifest
  const manifest = findManifest(cwd)
  if (!manifest) {
    logger.error('manifest.json not found in current directory')
    process.exit(1)
  }

  const errors = validateManifest(manifest)
  if (errors.length > 0) {
    logger.error('Invalid manifest.json:')
    errors.forEach((err) => logger.error(`  ${err}`))
    process.exit(1)
  }

  // Find entry file
  const entryFile = findEntry(cwd)
  if (!entryFile) {
    logger.error('No entry file found. Expected src/main.ts or src/main.js')
    process.exit(1)
  }

  logger.info(`Building plugin: ${manifest.name} v${manifest.version}`)
  logger.info(`Entry: ${path.relative(cwd, entryFile)}`)

  // Create output directory
  const outDir = path.join(cwd, options.outDir)
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  try {
    // Build with esbuild
    const result = await esbuild.build({
      entryPoints: [entryFile],
      bundle: true,
      platform: 'browser',
      format: 'esm',
      outfile: path.join(outDir, manifest.main),
      external: ['@pixra/plugin-sdk'],
      minify: false,
      sourcemap: true,
      target: 'es2020',
      logLevel: 'warning',
    })

    const outputFile = path.join(outDir, manifest.main)
    const stats = fs.statSync(outputFile)
    const sizeKB = (stats.size / 1024).toFixed(2)

    logger.success(`Built to ${path.relative(cwd, outputFile)} (${sizeKB} KB)`)
  } catch (error) {
    logger.error('Build failed')
    if (error instanceof Error) {
      logger.error(error.message)
    }
    process.exit(1)
  }
}

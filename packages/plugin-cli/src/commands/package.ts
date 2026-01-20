import fs from 'fs'
import path from 'path'
import archiver from 'archiver'
import { logger } from '../utils/logger.js'
import { findManifest } from '../utils/manifest.js'
import { build } from './build.js'

interface PackageOptions {
  outDir: string
}

export async function packagePlugin(options: PackageOptions) {
  const cwd = process.cwd()

  // Build first
  logger.info('Building plugin...')
  await build(options)

  // Get manifest
  const manifest = findManifest(cwd)
  if (!manifest) {
    logger.error('manifest.json not found')
    process.exit(1)
  }

  const outputDir = path.join(cwd, '.output')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const zipName = `${manifest.id}-${manifest.version}.zip`
  const zipPath = path.join(outputDir, zipName)

  // Remove old zip if exists
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath)
  }

  logger.info('Creating package...')

  return new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(zipPath)
    const archive = archiver('zip', { zlib: { level: 9 } })

    output.on('close', () => {
      const sizeKB = (archive.pointer() / 1024).toFixed(2)
      logger.success(`Package created: ${zipName} (${sizeKB} KB)`)
      resolve()
    })

    archive.on('error', (err) => {
      logger.error('Failed to create package')
      reject(err)
    })

    archive.pipe(output)

    // Add manifest
    archive.file(path.join(cwd, 'manifest.json'), { name: 'manifest.json' })

    // Add built main file
    const mainFile = path.join(cwd, options.outDir, manifest.main)
    if (fs.existsSync(mainFile)) {
      archive.file(mainFile, { name: manifest.main })
    } else {
      logger.warn(`Main file not found: ${manifest.main}`)
    }

    // Add sourcemap if exists
    const sourcemapFile = mainFile + '.map'
    if (fs.existsSync(sourcemapFile)) {
      archive.file(sourcemapFile, { name: manifest.main + '.map' })
    }

    // Add README if exists
    const readmePath = path.join(cwd, 'README.md')
    if (fs.existsSync(readmePath)) {
      archive.file(readmePath, { name: 'README.md' })
    }

    archive.finalize()
  })
}

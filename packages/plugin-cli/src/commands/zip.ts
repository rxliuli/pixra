import fs from 'fs'
import path from 'path'
import archiver from 'archiver'
import { logger } from '../utils/logger'
import { findManifest } from '../utils/manifest'
import { build } from './build'

const PLUGIN_ENTRY = 'plugin'
const OUT_DIR = 'dist'

interface PackageJson {
  version?: string
}

function readPackageJson(cwd: string): PackageJson | null {
  const pkgPath = path.join(cwd, 'package.json')
  if (!fs.existsSync(pkgPath)) {
    return null
  }
  try {
    return JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  } catch {
    return null
  }
}

export async function packagePlugin() {
  const cwd = process.cwd()

  // Build first
  logger.info('Building plugin...')
  await build()

  // Get manifest
  const manifest = findManifest(cwd)
  if (!manifest) {
    logger.error('plugin.json not found')
    process.exit(1)
  }

  // Read version from package.json (validated in build)
  const pkg = readPackageJson(cwd)
  const version = pkg!.version!

  const zipName = `${manifest.id}-${version}.zip`
  const zipPath = path.join(cwd, zipName)

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

    const outDir = path.join(cwd, OUT_DIR)

    // Add manifest from dist (already has updated version)
    const distManifestPath = path.join(outDir, 'plugin.json')
    if (fs.existsSync(distManifestPath)) {
      archive.file(distManifestPath, { name: 'plugin.json' })
    } else {
      logger.error('plugin.json not found in dist directory')
      process.exit(1)
    }

    // Add built main file
    const mainFile = path.join(outDir, PLUGIN_ENTRY)
    if (fs.existsSync(mainFile)) {
      archive.file(mainFile, { name: PLUGIN_ENTRY })
    } else {
      logger.error(`Main file not found: ${PLUGIN_ENTRY}`)
      process.exit(1)
    }

    archive.finalize()
  })
}

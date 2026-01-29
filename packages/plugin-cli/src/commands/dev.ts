import esbuild from 'esbuild'
import fs from 'fs'
import path from 'path'
import archiver from 'archiver'
import { logger } from '../utils/logger'
import { findManifest, validateManifest, PluginManifest } from '../utils/manifest'
import { findEntry } from '../utils/files'
import { inlineWorkerPlugin } from '../utils/esbuild-plugins'

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

async function createZip(
  cwd: string,
  outDir: string,
  manifest: PluginManifest,
  version: string
): Promise<void> {
  const zipName = `${manifest.id}-${version}.zip`
  const zipPath = path.join(cwd, zipName)

  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath)
  }

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath)
    const archive = archiver('zip', { zlib: { level: 9 } })

    output.on('close', () => {
      const sizeKB = (archive.pointer() / 1024).toFixed(2)
      logger.success(`Package created: ${zipName} (${sizeKB} KB)`)
      resolve()
    })

    archive.on('error', reject)
    archive.pipe(output)

    const distManifestPath = path.join(outDir, 'plugin.json')
    if (fs.existsSync(distManifestPath)) {
      archive.file(distManifestPath, { name: 'plugin.json' })
    }

    const mainFile = path.join(outDir, PLUGIN_ENTRY)
    if (fs.existsSync(mainFile)) {
      archive.file(mainFile, { name: PLUGIN_ENTRY })
    }

    archive.finalize()
  })
}

export async function dev() {
  const cwd = process.cwd()

  // Validate manifest
  const manifest = findManifest(cwd)
  if (!manifest) {
    logger.error('plugin.json not found in current directory')
    process.exit(1)
  }

  const errors = validateManifest(manifest)
  if (errors.length > 0) {
    logger.error('Invalid plugin.json:')
    errors.forEach((err) => logger.error(`  ${err}`))
    process.exit(1)
  }

  // Find entry file
  const entryFile = findEntry(cwd)
  if (!entryFile) {
    logger.error('No entry file found. Expected src/plugin.ts or src/plugin')
    process.exit(1)
  }

  // Read version from package.json (required)
  const pkg = readPackageJson(cwd)
  if (!pkg?.version) {
    logger.error('package.json must have a version field')
    process.exit(1)
  }
  const version = pkg.version

  const outDir = path.join(cwd, OUT_DIR)
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  logger.info(`Starting dev mode: ${manifest.name} v${version}`)
  logger.info(`Entry: ${path.relative(cwd, entryFile)}`)

  // esbuild watch mode with plugin for post-build actions
  const ctx = await esbuild.context({
    entryPoints: [entryFile],
    bundle: true,
    platform: 'browser',
    format: 'esm',
    outfile: path.join(outDir, PLUGIN_ENTRY),
    external: ['@pixra/plugin-sdk'],
    minify: false,
    sourcemap: true,
    target: 'es2020',
    logLevel: 'warning',
    plugins: [
      inlineWorkerPlugin(),
      {
        name: 'post-build',
        setup(build) {
          build.onEnd(async (result) => {
            if (result.errors.length > 0) {
              logger.error('Build failed')
              return
            }

            // Write manifest
            const outputManifest: PluginManifest = {
              ...manifest,
              version,
              main: PLUGIN_ENTRY,
            }
            fs.writeFileSync(
              path.join(outDir, 'plugin.json'),
              JSON.stringify(outputManifest, null, 2)
            )

            const outputFile = path.join(outDir, PLUGIN_ENTRY)
            const stats = fs.statSync(outputFile)
            const sizeKB = (stats.size / 1024).toFixed(2)
            logger.success(`Built (${sizeKB} KB)`)

            // Create zip
            await createZip(cwd, outDir, manifest, version)
          })
        },
      },
    ],
  })

  await ctx.watch()
  logger.info('Watching for changes...')

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Stopping...')
    await ctx.dispose()
    process.exit(0)
  })
}

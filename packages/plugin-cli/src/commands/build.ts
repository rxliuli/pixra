import esbuild from 'esbuild'
import fs from 'fs'
import path from 'path'
import { logger } from '../utils/logger.js'
import { findManifest, validateManifest, PluginManifest } from '../utils/manifest.js'
import { findEntry } from '../utils/files.js'
import { inlineWorkerPlugin } from '../utils/esbuild-plugins.js'

const PLUGIN_ENTRY = 'plugin.js'

interface BuildOptions {
  outDir: string
}

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

export async function build(options: BuildOptions) {
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
    logger.error('No entry file found. Expected src/main.ts or src/main.js')
    process.exit(1)
  }

  // Read version from package.json (required)
  const pkg = readPackageJson(cwd)
  if (!pkg?.version) {
    logger.error('package.json must have a version field')
    process.exit(1)
  }
  const version = pkg.version

  logger.info(`Building plugin: ${manifest.name} v${version}`)
  logger.info(`Entry: ${path.relative(cwd, entryFile)}`)

  // Create output directory
  const outDir = path.join(cwd, options.outDir)
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  try {
    // Build with esbuild
    await esbuild.build({
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
      plugins: [inlineWorkerPlugin()],
    })

    // Copy and update manifest with version from package.json
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

    logger.success(`Built to ${path.relative(cwd, outDir)}/ (${sizeKB} KB)`)
  } catch (error) {
    logger.error('Build failed')
    if (error instanceof Error) {
      logger.error(error.message)
    }
    process.exit(1)
  }
}

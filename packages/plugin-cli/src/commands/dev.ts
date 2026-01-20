import chokidar from 'chokidar'
import path from 'path'
import { logger } from '../utils/logger.js'
import { build } from './build.js'

interface DevOptions {
  outDir: string
}

export async function dev(options: DevOptions) {
  const cwd = process.cwd()
  const srcDir = path.join(cwd, 'src')

  logger.info('Starting development mode...')

  // Initial build
  await build(options)

  logger.info('Watching for changes...')

  // Watch for changes
  const watcher = chokidar.watch(srcDir, {
    persistent: true,
    ignoreInitial: true,
    ignored: /(^|[\/\\])\../, // ignore dotfiles
  })

  let building = false
  let pendingBuild = false

  const doBuild = async () => {
    if (building) {
      pendingBuild = true
      return
    }

    building = true
    pendingBuild = false

    try {
      await build(options)
    } catch (error) {
      // Error already logged in build function
    }

    building = false

    if (pendingBuild) {
      doBuild()
    }
  }

  watcher.on('change', (filePath) => {
    logger.info(`File changed: ${path.relative(cwd, filePath)}`)
    doBuild()
  })

  watcher.on('add', (filePath) => {
    logger.info(`File added: ${path.relative(cwd, filePath)}`)
    doBuild()
  })

  watcher.on('unlink', (filePath) => {
    logger.info(`File removed: ${path.relative(cwd, filePath)}`)
    doBuild()
  })

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    logger.info('Stopping...')
    watcher.close()
    process.exit(0)
  })
}

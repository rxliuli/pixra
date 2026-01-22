#!/usr/bin/env node

import { cac } from 'cac'
import { build } from './commands/build'
import { packagePlugin } from './commands/zip'
import { dev } from './commands/dev'

const cli = cac('pixra-plugin')

cli
  .command('build', 'Build the plugin')
  .option('--outDir <dir>', 'Output directory', { default: 'dist' })
  .action(async (options) => {
    await build(options)
  })

cli
  .command('zip', 'Package the plugin into a ZIP file')
  .option('--outDir <dir>', 'Output directory for built files', { default: 'dist' })
  .action(async (options) => {
    await packagePlugin(options)
  })

cli
  .command('dev', 'Build and watch for changes')
  .option('--outDir <dir>', 'Output directory', { default: 'dist' })
  .action(async (options) => {
    await dev(options)
  })

cli.help()
cli.version('0.0.1')

cli.parse()

#!/usr/bin/env node

import { cac } from 'cac'
import { build } from './commands/build'
import { packagePlugin } from './commands/zip'
import { dev } from './commands/dev'
import { init } from './commands/init'

const cli = cac('pixra-plugin')

cli
  .command('build', 'Build the plugin')
  .action(async () => {
    await build()
  })

cli
  .command('zip', 'Package the plugin into a ZIP file')
  .action(async () => {
    await packagePlugin()
  })

cli
  .command('dev', 'Build and watch for changes')
  .action(async () => {
    await dev()
  })

cli
  .command('init <directory>', 'Create a new plugin from template')
  .action(async (dirName: string) => {
    await init({ dirName })
  })

cli.help()
cli.version('0.0.1')

cli.parse()

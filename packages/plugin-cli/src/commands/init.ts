import fs from 'fs/promises'
import path from 'path'
import { logger } from '../utils/logger'
import { version as cliVersion } from '../../package.json'
import { version as sdkVersion } from '@pixra/plugin-sdk/package.json'

interface InitOptions {
  dirName: string
}

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export async function init(options: InitOptions) {
  const { dirName } = options

  if (!dirName) {
    logger.error('Directory name is required')
    logger.info('Usage: pixra init <directory>')
    process.exit(1)
  }

  // Generate plugin ID and name from directory name
  const kebabName = toKebabCase(dirName)
  const pluginId = `example.${kebabName}`
  const pluginName = toPascalCase(dirName)

  // Create directory
  const targetDir = path.join(process.cwd(), dirName)
  if (
    await fs
      .access(targetDir)
      .then(() => true)
      .catch(() => false)
  ) {
    logger.error(`Directory "${dirName}" already exists`)
    process.exit(1)
  }

  logger.info(`Creating plugin in ./${dirName} ...`)

  // Create directory structure
  await fs.mkdir(targetDir, { recursive: true })
  await fs.mkdir(path.join(targetDir, 'src'), { recursive: true })

  // Generate command ID from plugin ID
  const commandId = `${pluginId}.hello`

  // Create plugin.json
  const pluginJson = {
    id: pluginId,
    name: pluginName,
    description: '',
    main: 'plugin.js',
    contributes: {
      commands: [
        {
          command: commandId,
          title: `${pluginName}: Hello`,
        },
      ],
      menus: {
        tools: [
          {
            command: commandId,
          },
        ],
      },
    },
  }
  await fs.writeFile(
    path.join(targetDir, 'plugin.json'),
    JSON.stringify(pluginJson, null, 2) + '\n',
  )

  // Create package.json
  const packageJson = {
    name: pluginId,
    version: '0.0.1',
    description: '',
    private: true,
    type: 'module',
    scripts: {
      dev: 'pixra dev',
      build: 'pixra build',
      zip: 'pixra zip',
      prepublishOnly: 'pnpm build',
    },
    keywords: ['pixra-plugin'],
    license: 'MIT',
    files: ['dist'],
    publishConfig: {
      access: 'public',
    },
    devDependencies: {
      '@pixra/plugin-cli': '^' + cliVersion,
      '@pixra/plugin-sdk': '^' + sdkVersion,
      typescript: '^5.7.0',
    },
  }
  await fs.writeFile(
    path.join(targetDir, 'package.json'),
    JSON.stringify(packageJson, null, 2) + '\n',
  )

  // Create tsconfig.json
  const tsConfig = {
    compilerOptions: {
      target: 'ESNext',
      module: 'ESNext',
      lib: ['ESNext', 'DOM'],
      declaration: true,
      declarationMap: true,
      outDir: './dist',
      rootDir: './src',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      moduleResolution: 'bundler',
    },
    include: ['src'],
  }
  await fs.writeFile(
    path.join(targetDir, 'tsconfig.json'),
    JSON.stringify(tsConfig, null, 2) + '\n',
  )

  // Create src/plugin.ts
  const pluginTs = `import { commands, window, ExtensionContext } from '@pixra/plugin-sdk'

export function activate(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand('${commandId}', async () => {
      await window.showInformationMessage('Hello from ${pluginName}!')
    })
  )
}

export function deactivate() {}
`
  await fs.writeFile(path.join(targetDir, 'src', 'plugin.ts'), pluginTs)

  // Create .gitignore
  const gitignore = `node_modules/
dist/
*.zip
`
  await fs.writeFile(path.join(targetDir, '.gitignore'), gitignore)

  logger.success('Done!\n')

  console.log('Next steps:')
  console.log(`  cd ${dirName}`)
  console.log('  pnpm i')
  console.log('  pnpm zip')
}

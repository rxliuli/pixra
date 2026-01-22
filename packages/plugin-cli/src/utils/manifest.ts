import fs from 'fs'
import path from 'path'

export interface PluginManifest {
  id: string
  name: string
  version: string
  description?: string
  author?: string
  main: string
  minAppVersion?: string
  permissions?: string[]
  host_permissions?: string[]
  contributes?: {
    commands?: Array<{
      command: string
      title: string
    }>
    menus?: Record<string, Array<{ command: string }>>
  }
}

export function findManifest(cwd: string = process.cwd()): PluginManifest | null {
  const manifestPath = path.join(cwd, 'plugin.json')

  if (!fs.existsSync(manifestPath)) {
    return null
  }

  try {
    const content = fs.readFileSync(manifestPath, 'utf-8')
    return JSON.parse(content) as PluginManifest
  } catch {
    return null
  }
}

export function validateManifest(manifest: PluginManifest): string[] {
  const errors: string[] = []

  if (!manifest.id) errors.push('Missing required field: id')
  if (!manifest.name) errors.push('Missing required field: name')

  return errors
}

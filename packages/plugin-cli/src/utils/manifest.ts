import fs from 'fs'
import path from 'path'

export interface PluginManifest {
  id: string
  name: string
  version: string
  description?: string
  author?: string
  main: string
}

export function findManifest(cwd: string = process.cwd()): PluginManifest | null {
  const manifestPath = path.join(cwd, 'manifest.json')
  
  if (!fs.existsSync(manifestPath)) {
    return null
  }

  try {
    const content = fs.readFileSync(manifestPath, 'utf-8')
    return JSON.parse(content) as PluginManifest
  } catch (error) {
    return null
  }
}

export function validateManifest(manifest: PluginManifest): string[] {
  const errors: string[] = []

  if (!manifest.id) errors.push('Missing required field: id')
  if (!manifest.name) errors.push('Missing required field: name')
  if (!manifest.version) errors.push('Missing required field: version')
  if (!manifest.main) errors.push('Missing required field: main')

  return errors
}

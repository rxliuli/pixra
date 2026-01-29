import fs from 'fs'
import path from 'path'

export function findEntry(cwd: string = process.cwd()): string | null {
  const srcDir = path.join(cwd, 'src')

  if (!fs.existsSync(srcDir)) {
    return null
  }

  // Check for common entry file names
  const possibleEntries = ['plugin.ts', 'plugin']

  for (const entry of possibleEntries) {
    const entryPath = path.join(srcDir, entry)
    if (fs.existsSync(entryPath)) {
      return entryPath
    }
  }

  return null
}

export function getAllSourceFiles(srcDir: string): string[] {
  const files: string[] = []

  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (entry.isFile() && /\.(ts|js)$/.test(entry.name)) {
        files.push(fullPath)
      }
    }
  }

  if (fs.existsSync(srcDir)) {
    walk(srcDir)
  }

  return files
}

const PLUGINS_JSON_URL =
  'https://raw.githubusercontent.com/rxliuli/pixra-plugins/main/plugins.json'

export interface PluginInfo {
  id: string
  name: string
  description: string
  version: string
  minAppVersion?: string
  author: string
  repository?: string
  homepage?: string
  license?: string
  publisher: string
  official: boolean
  publishedAt: string
  size: number
}

export interface PluginsJson {
  updatedAt: string
  plugins: PluginInfo[]
}

export async function fetchPlugins(): Promise<PluginsJson> {
  const response = await fetch(PLUGINS_JSON_URL)
  if (!response.ok) {
    throw new Error(`Failed to fetch plugins: ${response.status}`)
  }
  return response.json()
}

export function filterPlugins(plugins: PluginInfo[], query: string): PluginInfo[] {
  if (!query.trim()) {
    return plugins
  }
  const lowerQuery = query.toLowerCase()
  return plugins.filter(
    (p) =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery) ||
      p.id.toLowerCase().includes(lowerQuery),
  )
}

export async function downloadPlugin(pluginId: string): Promise<Blob> {
  const baseUrl = PLUGINS_JSON_URL.replace('/plugins.json', '')
  const url = `${baseUrl}/plugins/${pluginId}/plugin.zip`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download plugin: ${response.status}`)
  }
  return response.blob()
}

export async function fetchReadme(pluginId: string): Promise<string | null> {
  const baseUrl = PLUGINS_JSON_URL.replace('/plugins.json', '')
  const url = `${baseUrl}/plugins/${pluginId}/README.md`
  const response = await fetch(url)
  if (!response.ok) {
    return null
  }
  return response.text()
}

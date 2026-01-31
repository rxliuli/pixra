import { get, set } from 'idb-keyval'

const PLUGIN_CONFIG_KEY = 'pluginConfigurations'

/**
 * Plugin configuration storage
 * Stores all plugin configurations in a single key as a flat object
 * Keys are namespaced by convention (e.g., "openai-edit.apiKey")
 */
export class ConfigurationStorage {
  private cache: Record<string, unknown> | null = null
  private defaults: Record<string, unknown> = {}

  /**
   * Load all configurations from storage
   */
  private async loadAll(): Promise<Record<string, unknown>> {
    if (this.cache !== null) {
      return this.cache
    }
    const data = await get<Record<string, unknown>>(PLUGIN_CONFIG_KEY)
    this.cache = data || {}
    return this.cache
  }

  /**
   * Save all configurations to storage
   */
  private async saveAll(data: Record<string, unknown>): Promise<void> {
    this.cache = data
    await set(PLUGIN_CONFIG_KEY, data)
  }

  /**
   * Register default values for plugin configuration keys
   * @param defaults - Record of key -> default value
   */
  registerDefaults(defaults: Record<string, unknown>): void {
    Object.assign(this.defaults, defaults)
  }

  /**
   * Clear registered defaults (useful when plugins are uninstalled)
   * @param keys - Keys to remove from defaults
   */
  unregisterDefaults(keys: string[]): void {
    for (const key of keys) {
      delete this.defaults[key]
    }
  }

  /**
   * Get a configuration value
   * @param key - The configuration key (e.g., "openai-edit.apiKey")
   */
  async get<T>(key: string): Promise<T | undefined> {
    const all = await this.loadAll()
    const value = all[key]
    if (value !== undefined) {
      return value as T
    }
    return this.defaults[key] as T | undefined
  }

  /**
   * Set a configuration value
   * @param key - The configuration key
   * @param value - The value to set
   */
  async set<T>(key: string, value: T): Promise<void> {
    const all = await this.loadAll()
    all[key] = value
    await this.saveAll(all)
  }

  /**
   * Delete a configuration value
   * @param key - The configuration key
   */
  async delete(key: string): Promise<void> {
    const all = await this.loadAll()
    delete all[key]
    await this.saveAll(all)
  }

  /**
   * Get all configuration values (merged with defaults)
   */
  async getAll(): Promise<Record<string, unknown>> {
    const stored = await this.loadAll()
    return { ...this.defaults, ...stored }
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.cache = null
  }
}

// Singleton instance
export const configurationStorage = new ConfigurationStorage()

if (import.meta.env.DEV) {
  Reflect.set(globalThis, 'configurationStorage', configurationStorage)
}

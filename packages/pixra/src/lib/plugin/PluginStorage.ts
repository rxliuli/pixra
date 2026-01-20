import { get, set, del, keys } from 'idb-keyval';
import type { InstalledPlugin } from './PluginLoader';

const PLUGIN_STORE_PREFIX = 'plugin:';

/**
 * Plugin storage - manages plugin persistence using IndexedDB
 */
export class PluginStorage {
  /**
   * Save plugin to storage
   */
  async savePlugin(plugin: InstalledPlugin): Promise<void> {
    const key = PLUGIN_STORE_PREFIX + plugin.manifest.id;
    await set(key, plugin);
  }
  
  /**
   * Load plugin from storage
   */
  async loadPlugin(pluginId: string): Promise<InstalledPlugin | null> {
    const key = PLUGIN_STORE_PREFIX + pluginId;
    const plugin = await get<InstalledPlugin>(key);
    return plugin || null;
  }
  
  /**
   * Delete plugin from storage
   */
  async deletePlugin(pluginId: string): Promise<void> {
    const key = PLUGIN_STORE_PREFIX + pluginId;
    await del(key);
  }
  
  /**
   * List all installed plugins
   */
  async listPlugins(): Promise<InstalledPlugin[]> {
    const allKeys = await keys();
    const pluginKeys = allKeys.filter(key => 
      typeof key === 'string' && key.startsWith(PLUGIN_STORE_PREFIX)
    );
    
    const plugins = await Promise.all(
      pluginKeys.map(key => get<InstalledPlugin>(key))
    );
    
    return plugins.filter((p): p is InstalledPlugin => p !== undefined);
  }
  
  /**
   * Check if plugin exists
   */
  async hasPlugin(pluginId: string): Promise<boolean> {
    const plugin = await this.loadPlugin(pluginId);
    return plugin !== null;
  }
}

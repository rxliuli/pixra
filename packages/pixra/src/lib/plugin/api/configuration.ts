/**
 * Configuration API handlers
 */

import { configurationStorage } from '../ConfigurationStorage'
import { PluginStorage } from '../PluginStorage'
import type { ApiContext } from '.'

const pluginStorage = new PluginStorage()

/**
 * Check if a plugin owns a configuration key
 */
async function isKeyOwnedByPlugin(
  pluginId: string,
  key: string,
): Promise<boolean> {
  const plugin = await pluginStorage.loadPlugin(pluginId)
  if (!plugin) {
    return false
  }

  const properties = plugin.manifest.contributes?.configuration?.properties
  if (!properties) {
    return false
  }

  return key in properties
}

/**
 * Get a configuration value
 */
export async function getConfiguration(
  ctx: ApiContext,
  key: string,
): Promise<unknown> {
  const isOwned = await isKeyOwnedByPlugin(ctx.pluginId, key)
  if (!isOwned) {
    throw new Error(
      `Plugin "${ctx.pluginId}" does not have access to configuration key "${key}"`,
    )
  }
  return configurationStorage.get(key)
}

/**
 * Set a configuration value
 */
export async function setConfiguration(
  ctx: ApiContext,
  key: string,
  value: unknown,
): Promise<void> {
  const isOwned = await isKeyOwnedByPlugin(ctx.pluginId, key)
  if (!isOwned) {
    throw new Error(
      `Plugin "${ctx.pluginId}" does not have access to configuration key "${key}"`,
    )
  }
  await configurationStorage.set(key, value)
}

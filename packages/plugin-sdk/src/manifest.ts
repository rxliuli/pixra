/**
 * Plugin manifest schema
 */
export interface PluginManifest {
  /** Unique identifier for the plugin (e.g., "pixra.plugin-name") */
  id: string
  /** Display name of the plugin */
  name: string
  /** Plugin version (semver) */
  version: string
  /** Plugin description */
  description: string
  /** Main entry file */
  main: string
  /** Plugin contributions */
  contributes?: {
    commands?: CommandContribution[]
    menus?: MenuContributions
    configuration?: ConfigurationContribution
  }
  /**
   * Permissions required by the plugin (API access)
   * e.g., ["fetch"] to enable network access
   */
  permissions?: 'fetch'[]
  /**
   * Host permissions - URL patterns the plugin is allowed to access
   * Only effective when "fetch" is in permissions
   * Uses URL pattern syntax (e.g., "https://huggingface.co/*", "https://*.githubusercontent.com/*")
   */
  host_permissions?: string[]
}

export interface CommandContribution {
  /** Command identifier */
  command: string
  /** Display title */
  title: string
  /** When clause for command enablement */
  enablement?: string
}

/**
 * Menu contributions - key is menu group id (e.g., 'file', 'edit', 'tools')
 */
export type MenuContributions = Record<'tools', MenuContribution[]>

export interface MenuContribution {
  /** Command identifier to execute when menu item is clicked */
  command: string
}

/**
 * Configuration contribution - declares plugin settings
 */
export interface ConfigurationContribution {
  /** Display title for the configuration section */
  title: string
  /** Configuration properties */
  properties: Record<string, ConfigurationProperty>
}

/**
 * Configuration property definition
 */
export interface ConfigurationProperty {
  /** Property type */
  type: 'string' | 'number' | 'boolean'
  /** Default value */
  default?: string | number | boolean
  /** Description shown in settings UI */
  description?: string
  /** Enum values for string type */
  enum?: string[]
  /** Descriptions for enum values */
  enumDescriptions?: string[]
}

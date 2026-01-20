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
  }
}

export interface CommandContribution {
  /** Command identifier */
  command: string
  /** Display title */
  title: string
}

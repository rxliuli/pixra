/**
 * Pixra Plugin SDK
 *
 * This SDK provides TypeScript definitions for developing Pixra plugins.
 */

export type * from './manifest'
export type * from './api'

// Re-export commonly used types
export type {
  ExtensionContext,
  Disposable,
  Window,
  Commands,
  Workspace,
} from './api'

export type { PluginManifest, CommandContribution } from './manifest'

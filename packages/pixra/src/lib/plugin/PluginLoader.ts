import type { PluginManifest } from '@pixra/plugin-sdk';

/**
 * Internal plugin representation
 */
export interface InstalledPlugin {
  /** Manifest */
  manifest: PluginManifest;
  /** Plugin files (code and assets) */
  files: Record<string, string | Blob>;
  /** Installation date */
  installDate: Date;
  /** Whether plugin is enabled */
  enabled: boolean;
  /** Cached bundled code */
  bundledCode?: string;
}

/**
 * Plugin loader - handles loading plugins from different sources
 */
export class PluginLoader {
  /**
   * Load plugin from ZIP file
   */
  async loadFromZip(file: File): Promise<{ manifest: PluginManifest; files: Record<string, string | Blob> }> {
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(file);
    
    // Read manifest
    const manifestFile = zip.file('manifest.json');
    if (!manifestFile) {
      throw new Error('manifest.json not found in plugin package');
    }
    
    const manifestText = await manifestFile.async('text');
    const manifest: PluginManifest = JSON.parse(manifestText);
    
    // Validate manifest
    this.validateManifest(manifest);
    
    // Extract all files
    const files: Record<string, string | Blob> = {};
    
    for (const [path, zipEntry] of Object.entries(zip.files)) {
      if (zipEntry.dir) continue;
      
      // Text files (js, json, etc.)
      if (path.endsWith('.js') || path.endsWith('.json') || path.endsWith('.md')) {
        files[path] = await zipEntry.async('text');
      } else {
        // Binary files (images, etc.)
        files[path] = await zipEntry.async('blob');
      }
    }
    
    return { manifest, files };
  }
  
  /**
   * Validate plugin manifest
   */
  private validateManifest(manifest: PluginManifest): void {
    if (!manifest.id) {
      throw new Error('Plugin manifest missing required field: id');
    }
    if (!manifest.name) {
      throw new Error('Plugin manifest missing required field: name');
    }
    if (!manifest.version) {
      throw new Error('Plugin manifest missing required field: version');
    }
    if (!manifest.main) {
      throw new Error('Plugin manifest missing required field: main');
    }
  }
}

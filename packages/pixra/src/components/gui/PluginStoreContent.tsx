import { useState, useMemo, useEffect, lazy, Suspense } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'

import {
  fetchPlugins,
  fetchReadme,
  downloadPlugin,
  filterPlugins,
  type PluginInfo,
} from '@/lib/plugin/PluginStoreService'
import { pluginManager } from '@/lib/plugin'
import { toast } from 'sonner'
import {
  SearchIcon,
  DownloadIcon,
  CheckIcon,
  Loader2Icon,
  Trash2Icon,
} from 'lucide-react'

const Markdown = lazy(() => import('react-markdown'))

export function PluginStoreContent() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlugin, setSelectedPlugin] = useState<PluginInfo | null>(null)

  // Fetch all plugins
  const {
    data: pluginsData,
    isLoading: pluginsLoading,
    error: pluginsError,
  } = useQuery({
    queryKey: ['plugins'],
    queryFn: fetchPlugins,
  })

  // Filter plugins based on search query
  const filteredPlugins = useMemo(() => {
    if (!pluginsData?.plugins) return []
    return filterPlugins(pluginsData.plugins, searchQuery)
  }, [pluginsData?.plugins, searchQuery])

  // Auto-select first plugin when list changes
  useEffect(() => {
    if (filteredPlugins.length > 0 && !selectedPlugin) {
      setSelectedPlugin(filteredPlugins[0])
    }
  }, [filteredPlugins, selectedPlugin])

  // Fetch installed plugins
  const { data: installedPlugins = [] } = useQuery({
    queryKey: ['installed-plugins'],
    queryFn: () => pluginManager.listInstalled(),
  })

  const installedIds = useMemo(
    () => new Set(installedPlugins.map((p) => p.manifest.id)),
    [installedPlugins],
  )

  // Fetch README for selected plugin
  const { data: readme } = useQuery({
    queryKey: ['plugin-readme', selectedPlugin?.id],
    queryFn: () => fetchReadme(selectedPlugin!.id),
    enabled: !!selectedPlugin,
  })

  // Install plugin mutation
  const installMutation = useMutation({
    mutationFn: async (plugin: PluginInfo) => {
      const blob = await downloadPlugin(plugin.id)
      const file = new File([blob], `${plugin.id}.zip`, {
        type: 'application/zip',
      })
      await pluginManager.installFromZip(file)
      return plugin
    },
    onSuccess: (plugin) => {
      toast.success(`${plugin.name} installed successfully`)
      queryClient.invalidateQueries({ queryKey: ['installed-plugins'] })
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : String(error)
      toast.error(`Failed to install: ${message}`)
    },
  })

  // Uninstall plugin mutation
  const uninstallMutation = useMutation({
    mutationFn: async (plugin: PluginInfo) => {
      await pluginManager.uninstall(plugin.id)
      return plugin
    },
    onSuccess: (plugin) => {
      toast.success(`${plugin.name} uninstalled successfully`)
      queryClient.invalidateQueries({ queryKey: ['installed-plugins'] })
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : String(error)
      toast.error(`Failed to uninstall: ${message}`)
    },
  })

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left panel - Search and list */}
      <div className="w-72 border-r flex flex-col">
        {/* Search input */}
        <div className="p-3 border-b">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search plugins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border rounded-md outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Plugin list */}
        <div className="flex-1 overflow-y-auto">
          {pluginsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : pluginsError ? (
            <div className="flex items-center justify-center h-32 text-destructive text-sm">
              Failed to load plugins
            </div>
          ) : filteredPlugins.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              No plugins found
            </div>
          ) : (
            filteredPlugins.map((plugin) => (
              <div
                key={plugin.id}
                onClick={() => setSelectedPlugin(plugin)}
                className={`p-3 cursor-pointer border-b hover:bg-accent/50 ${
                  selectedPlugin?.id === plugin.id ? 'bg-accent' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">
                        {plugin.name}
                      </span>
                      {plugin.official && (
                        <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                          Official
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {plugin.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      v{plugin.version} · {plugin.author}
                    </p>
                  </div>
                  {installedIds.has(plugin.id) && (
                    <CheckIcon className="h-4 w-4 text-green-600 shrink-0" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right panel - README preview */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedPlugin ? (
          <>
            {/* Plugin header */}
            <div className="p-4 border-b flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{selectedPlugin.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedPlugin.description}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>v{selectedPlugin.version}</span>
                  <span>{selectedPlugin.author}</span>
                  {selectedPlugin.license && (
                    <span>{selectedPlugin.license}</span>
                  )}
                </div>
              </div>
              {installedIds.has(selectedPlugin.id) ? (
                <Button
                  onClick={() => uninstallMutation.mutate(selectedPlugin)}
                  disabled={uninstallMutation.isPending}
                  variant="destructive"
                  size="sm"
                >
                  {uninstallMutation.isPending &&
                  uninstallMutation.variables?.id === selectedPlugin.id ? (
                    <Loader2Icon className="animate-spin" />
                  ) : (
                    <Trash2Icon />
                  )}
                  Uninstall
                </Button>
              ) : (
                <Button
                  onClick={() => installMutation.mutate(selectedPlugin)}
                  disabled={installMutation.isPending}
                  size="sm"
                >
                  {installMutation.isPending &&
                  installMutation.variables?.id === selectedPlugin.id ? (
                    <Loader2Icon className="animate-spin" />
                  ) : (
                    <DownloadIcon />
                  )}
                  Install
                </Button>
              )}
            </div>

            {/* README content */}
            <div className="flex-1 overflow-y-auto p-4">
              {readme ? (
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-32">
                      <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  }
                >
                  <div className="prose prose-sm max-w-none dark:prose-invert [&>h1]:hidden">
                    <Markdown>{readme}</Markdown>
                  </div>
                </Suspense>
              ) : (
                <div className="text-muted-foreground text-sm">
                  No README available
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a plugin to view details
          </div>
        )}
      </div>
    </div>
  )
}

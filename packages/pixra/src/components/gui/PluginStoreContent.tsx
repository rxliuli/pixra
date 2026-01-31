import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

import {
  fetchPlugins,
  fetchReadme,
  downloadPlugin,
  filterPlugins,
  type PluginInfo,
} from '@/lib/plugin/PluginStoreService'
import { pluginManager, type InstalledPlugin } from '@/lib/plugin'
import { toast } from 'sonner'
import {
  SearchIcon,
  DownloadIcon,
  CheckIcon,
  Loader2Icon,
  Trash2Icon,
  ArrowUpCircleIcon,
  HardDriveIcon,
} from 'lucide-react'
import Markdown from 'react-markdown'

type Tab = 'store' | 'installed'

// Common type for displaying plugins in both tabs
type DisplayPlugin =
  | { type: 'remote'; plugin: PluginInfo }
  | { type: 'local'; plugin: InstalledPlugin }

export function PluginStoreContent() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<Tab>('store')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlugin, setSelectedPlugin] = useState<DisplayPlugin | null>(
    null,
  )

  // Fetch remote plugins
  const {
    data: pluginsData,
    isLoading: pluginsLoading,
    error: pluginsError,
  } = useQuery({
    queryKey: ['plugins'],
    queryFn: fetchPlugins,
    refetchOnMount: 'always',
  })

  // Fetch installed plugins
  const installedPluginsQuery = useQuery({
    queryKey: ['installed-plugins'],
    queryFn: () => pluginManager.listInstalled(),
    refetchOnMount: 'always',
  })

  const remotePlugins = pluginsData?.plugins ?? []
  const installedPlugins = installedPluginsQuery.data ?? []
  const installedIds = new Set(installedPlugins.map((p) => p.manifest.id))

  // Map for update detection: id -> remote plugin
  const remotePluginMap = new Map(remotePlugins.map((p) => [p.id, p]))

  // Check if an installed plugin has an update available
  const getUpdateInfo = (installed: InstalledPlugin) => {
    const remote = remotePluginMap.get(installed.manifest.id)
    if (remote && remote.version !== installed.manifest.version) {
      return remote
    }
    return null
  }

  // Filter installed plugins
  const filteredInstalledPlugins = installedPlugins.filter(
    (p) =>
      p.manifest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.manifest.description ?? '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
  )

  // Filter store plugins
  const filteredMarketplacePlugins = filterPlugins(remotePlugins, searchQuery)

  // Auto-select first plugin when tab or list changes
  useEffect(() => {
    if (activeTab === 'installed') {
      if (filteredInstalledPlugins.length > 0) {
        setSelectedPlugin({
          type: 'local',
          plugin: filteredInstalledPlugins[0],
        })
      } else {
        setSelectedPlugin(null)
      }
    } else {
      if (filteredMarketplacePlugins.length > 0) {
        setSelectedPlugin({
          type: 'remote',
          plugin: filteredMarketplacePlugins[0],
        })
      } else {
        setSelectedPlugin(null)
      }
    }
  }, [activeTab, searchQuery, installedPlugins.length, remotePlugins.length])

  // Fetch README for selected remote plugin
  const pluginReadmeQuery = useQuery({
    queryKey: [
      'plugin-readme',
      selectedPlugin?.type === 'remote' ? selectedPlugin.plugin.id : null,
    ],
    queryFn: () =>
      fetchReadme(
        selectedPlugin?.type === 'remote' ? selectedPlugin.plugin.id : '',
      ),
    enabled: selectedPlugin?.type === 'remote',
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
    mutationFn: async (pluginId: string) => {
      await pluginManager.uninstall(pluginId)
      return pluginId
    },
    onSuccess: () => {
      toast.success('Plugin uninstalled successfully')
      queryClient.invalidateQueries({ queryKey: ['installed-plugins'] })
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : String(error)
      toast.error(`Failed to uninstall: ${message}`)
    },
  })

  const renderInstalledPluginItem = (plugin: InstalledPlugin) => {
    const updateInfo = getUpdateInfo(plugin)
    const isLocal = !remotePluginMap.has(plugin.manifest.id)
    const isSelected =
      selectedPlugin?.type === 'local' &&
      selectedPlugin.plugin.manifest.id === plugin.manifest.id

    return (
      <div
        key={plugin.manifest.id}
        onClick={() => setSelectedPlugin({ type: 'local', plugin })}
        className={`p-3 cursor-pointer border-b hover:bg-accent/50 ${
          isSelected ? 'bg-accent' : ''
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">
                {plugin.manifest.name}
              </span>
              {isLocal && (
                <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded flex items-center gap-1">
                  <HardDriveIcon className="h-3 w-3" />
                  Local
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {plugin.manifest.description ?? 'No description'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              v{plugin.manifest.version}
            </p>
          </div>
          {updateInfo && (
            <ArrowUpCircleIcon className="h-4 w-4 text-orange-500 shrink-0" />
          )}
        </div>
      </div>
    )
  }

  const renderMarketplacePluginItem = (plugin: PluginInfo) => {
    const isInstalled = installedIds.has(plugin.id)
    const isSelected =
      selectedPlugin?.type === 'remote' &&
      selectedPlugin.plugin.id === plugin.id

    return (
      <div
        key={plugin.id}
        onClick={() => setSelectedPlugin({ type: 'remote', plugin })}
        className={`p-3 cursor-pointer border-b hover:bg-accent/50 ${
          isSelected ? 'bg-accent' : ''
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">
                {plugin.name}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {plugin.description}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              v{plugin.version} · {plugin.author}
            </p>
          </div>
          {isInstalled && (
            <CheckIcon className="h-4 w-4 text-green-600 shrink-0" />
          )}
        </div>
      </div>
    )
  }

  const renderDetailPanel = () => {
    if (!selectedPlugin) {
      return (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          Select a plugin to view details
        </div>
      )
    }

    if (selectedPlugin.type === 'local') {
      const plugin = selectedPlugin.plugin
      const updateInfo = getUpdateInfo(plugin)
      const isLocal = !remotePluginMap.has(plugin.manifest.id)

      return (
        <>
          <div className="p-4 border-b flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">
                  {plugin.manifest.name}
                </h3>
                {isLocal && (
                  <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded flex items-center gap-1">
                    <HardDriveIcon className="h-3 w-3" />
                    Local
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {plugin.manifest.description ?? 'No description'}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>v{plugin.manifest.version}</span>
              </div>
            </div>
            <div className="flex gap-2">
              {updateInfo && (
                <Button
                  onClick={() => installMutation.mutate(updateInfo)}
                  disabled={installMutation.isPending}
                  size="sm"
                >
                  {installMutation.isPending ? (
                    <Loader2Icon className="animate-spin" />
                  ) : (
                    <ArrowUpCircleIcon />
                  )}
                  Update to v{updateInfo.version}
                </Button>
              )}
              <Button
                onClick={() => uninstallMutation.mutate(plugin.manifest.id)}
                disabled={uninstallMutation.isPending}
                variant="destructive"
                size="sm"
              >
                {uninstallMutation.isPending ? (
                  <Loader2Icon className="animate-spin" />
                ) : (
                  <Trash2Icon />
                )}
                Uninstall
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="text-muted-foreground text-sm">
              {isLocal
                ? 'This is a locally installed plugin. No additional information available.'
                : 'No README available'}
            </div>
          </div>
        </>
      )
    }

    // Remote plugin
    const plugin = selectedPlugin.plugin
    const isInstalled = installedIds.has(plugin.id)

    return (
      <>
        <div className="p-4 border-b flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">{plugin.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {plugin.description}
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span>v{plugin.version}</span>
              <span>{plugin.author}</span>
              {plugin.license && <span>{plugin.license}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            {isInstalled ? (
              <Button
                onClick={() => uninstallMutation.mutate(plugin.id)}
                disabled={uninstallMutation.isPending}
                variant="destructive"
                size="sm"
              >
                {uninstallMutation.isPending ? (
                  <Loader2Icon className="animate-spin" />
                ) : (
                  <Trash2Icon />
                )}
                Uninstall
              </Button>
            ) : (
              <Button
                onClick={() => installMutation.mutate(plugin)}
                disabled={installMutation.isPending}
                size="sm"
              >
                {installMutation.isPending ? (
                  <Loader2Icon className="animate-spin" />
                ) : (
                  <DownloadIcon />
                )}
                Install
              </Button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {pluginReadmeQuery.data ? (
            <div className="prose prose-sm max-w-none dark:prose-invert [&>h1]:hidden">
              <Markdown>{pluginReadmeQuery.data}</Markdown>
            </div>
          ) : pluginReadmeQuery.isLoading ? (
            <div className="text-muted-foreground text-sm">
              Loading README...
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">
              No README available
            </div>
          )}
        </div>
      </>
    )
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left panel - Tabs, Search and list */}
      <div className="w-72 border-r flex flex-col">
        {/* Tab buttons */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as Tab)}
          className="gap-0"
          activationMode="manual"
        >
          <TabsList variant="line" className="w-full justify-stretch">
            <TabsTrigger value="store">Store</TabsTrigger>
            <TabsTrigger value="installed">Installed</TabsTrigger>
          </TabsList>
        </Tabs>

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
          {activeTab === 'installed' ? (
            installedPluginsQuery.isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredInstalledPlugins.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                No installed plugins
              </div>
            ) : (
              filteredInstalledPlugins.map(renderInstalledPluginItem)
            )
          ) : pluginsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : pluginsError ? (
            <div className="flex items-center justify-center h-32 text-destructive text-sm">
              Failed to load plugins
            </div>
          ) : filteredMarketplacePlugins.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              No plugins found
            </div>
          ) : (
            filteredMarketplacePlugins.map(renderMarketplacePluginItem)
          )}
        </div>
      </div>

      {/* Right panel - Detail view */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {renderDetailPanel()}
      </div>
    </div>
  )
}

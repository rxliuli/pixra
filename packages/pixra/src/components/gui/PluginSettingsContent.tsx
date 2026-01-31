import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pluginManager, type InstalledPlugin } from '@/lib/plugin'
import { configurationStorage } from '@/lib/plugin/ConfigurationStorage'
import { toast } from 'sonner'
import { Loader2Icon, SettingsIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type {
  ConfigurationProperty,
  ConfigurationContribution,
} from '@pixra/plugin-sdk'

interface PluginWithConfig {
  plugin: InstalledPlugin
  config: ConfigurationContribution
}

export function PluginSettingsContent() {
  const queryClient = useQueryClient()
  const [selectedPluginId, setSelectedPluginId] = useState<string | null>(null)
  const [formValues, setFormValues] = useState<Record<string, unknown>>({})

  // Fetch installed plugins that have configuration
  const pluginsQuery = useQuery({
    queryKey: ['plugins-with-config'],
    queryFn: async () => {
      const installed = await pluginManager.listInstalled()
      const pluginsWithConfig: PluginWithConfig[] = []

      for (const plugin of installed) {
        const config = plugin.manifest.contributes?.configuration
        if (config && Object.keys(config.properties).length > 0) {
          pluginsWithConfig.push({ plugin, config })
        }
      }

      return pluginsWithConfig
    },
    refetchOnMount: 'always',
  })

  // Fetch all configuration values
  const configQuery = useQuery({
    queryKey: ['plugin-configurations'],
    queryFn: () => configurationStorage.getAll(),
    refetchOnMount: 'always',
  })

  const pluginsWithConfig = pluginsQuery.data ?? []
  const allConfig = configQuery.data ?? {}

  // Auto-select first plugin when data loads
  useEffect(() => {
    if (pluginsWithConfig.length > 0 && !selectedPluginId) {
      setSelectedPluginId(pluginsWithConfig[0].plugin.manifest.id)
    }
  }, [pluginsWithConfig, selectedPluginId])

  // Load form values when plugin selection changes
  useEffect(() => {
    if (!selectedPluginId) {
      setFormValues({})
      return
    }

    const selected = pluginsWithConfig.find(
      (p) => p.plugin.manifest.id === selectedPluginId,
    )
    if (!selected) return

    const values: Record<string, unknown> = {}
    for (const [key, prop] of Object.entries(selected.config.properties)) {
      values[key] = allConfig[key] ?? prop.default
    }
    setFormValues(values)
  }, [selectedPluginId, allConfig, pluginsWithConfig])

  // Auto-save mutation
  const saveMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: unknown }) => {
      await configurationStorage.set(key, value)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plugin-configurations'] })
    },
    onError: (error) => {
      toast.error(
        `Failed to save: ${error instanceof Error ? error.message : String(error)}`,
      )
    },
  })

  const handleValueChange = (key: string, value: unknown) => {
    setFormValues((prev) => ({ ...prev, [key]: value }))
    // Auto-save on change
    saveMutation.mutate({ key, value })
  }

  const selectedPlugin = pluginsWithConfig.find(
    (p) => p.plugin.manifest.id === selectedPluginId,
  )

  const renderPropertyInput = (key: string, prop: ConfigurationProperty) => {
    const value = formValues[key]

    if (prop.type === 'boolean') {
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={Boolean(value)}
            onCheckedChange={(checked) => handleValueChange(key, checked)}
          />
          <span className="text-sm">{prop.description || key}</span>
        </label>
      )
    }

    if (prop.type === 'number') {
      return (
        <div className="space-y-1">
          <label className="text-sm font-medium">{key}</label>
          {prop.description && (
            <p className="text-xs text-muted-foreground">{prop.description}</p>
          )}
          <Input
            type="number"
            value={(value as number) ?? ''}
            onChange={(e) =>
              handleValueChange(
                key,
                e.target.value ? Number(e.target.value) : undefined,
              )
            }
          />
        </div>
      )
    }

    // string type
    if (prop.enum) {
      return (
        <div className="space-y-1">
          <label className="text-sm font-medium">{key}</label>
          {prop.description && (
            <p className="text-xs text-muted-foreground">{prop.description}</p>
          )}
          <Select
            value={(value as string) ?? ''}
            onValueChange={(val) => handleValueChange(key, val)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {prop.enum.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    }

    return (
      <div className="space-y-1">
        <label className="text-sm font-medium">{key}</label>
        {prop.description && (
          <p className="text-xs text-muted-foreground">{prop.description}</p>
        )}
        <Input
          type="text"
          value={(value as string) ?? ''}
          onChange={(e) => handleValueChange(key, e.target.value)}
        />
      </div>
    )
  }

  if (pluginsQuery.isLoading || configQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (pluginsWithConfig.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <SettingsIcon className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-sm">No plugins with configuration found</p>
        <p className="text-xs mt-1">
          Install plugins that have settings to configure them here
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left panel - Plugin list */}
      <div className="w-56 border-r flex flex-col">
        <div className="flex-1 overflow-y-auto">
          {pluginsWithConfig.map(({ plugin, config }) => (
            <div
              key={plugin.manifest.id}
              onClick={() => setSelectedPluginId(plugin.manifest.id)}
              className={`p-3 cursor-pointer border-b hover:bg-accent/50 ${
                selectedPluginId === plugin.manifest.id ? 'bg-accent' : ''
              }`}
            >
              <div className="font-medium text-sm truncate">
                {config.title || plugin.manifest.name}
              </div>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {plugin.manifest.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - Settings form */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedPlugin ? (
          <>
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">
                {selectedPlugin.config.title ||
                  selectedPlugin.plugin.manifest.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                Configure plugin settings
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4 max-w-lg">
                {Object.entries(selectedPlugin.config.properties).map(
                  ([key, prop]) => (
                    <div key={key}>{renderPropertyInput(key, prop)}</div>
                  ),
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a plugin to configure
          </div>
        )}
      </div>
    </div>
  )
}

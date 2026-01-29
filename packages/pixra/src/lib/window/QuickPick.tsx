import { observer } from 'mobx-react-lite'
import { quickPickStore, type QuickPickItem } from './QuickPickStore'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { useState, useEffect } from 'react'
import { useCommandState } from 'cmdk'

// Helper component to watch cmdk value changes using useCommandState hook
function ValueWatcher({
  onValueChange,
}: {
  onValueChange: (value: string) => void
}) {
  const value = useCommandState((state) => state.value)
  useEffect(() => {
    if (value) {
      onValueChange(value)
    }
  }, [value, onValueChange])
  return null
}

export const QuickPick = observer(() => {
  const state = quickPickStore.currentState
  const [inputValue, setInputValue] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  if (!quickPickStore.isOpen || !state) {
    return null
  }

  // QuickPick mode
  if (state.type === 'quickpick' && state.items) {
    // Build a map from cmdk value string to QuickPickItem for onDidSelectItem lookup
    // Note: cmdk lowercases values internally for comparison
    const valueToItemMap = new Map<string, QuickPickItem>(
      state.items.map((item, index) => [
        `${index}:${item.label}`.toLowerCase(),
        item,
      ]),
    )

    const handleValueChange = (value: string) => {
      if (state.onDidSelectItem) {
        const item = valueToItemMap.get(value.toLowerCase())
        if (item) {
          state.onDidSelectItem(item)
        }
      }
    }

    // Calculate defaultValue from activeItem
    // Use findIndex with label comparison since activeItem may be a different object reference
    const activeIndex = state.activeItem
      ? state.items.findIndex((item) => item.label === state.activeItem?.label)
      : -1
    const defaultValue =
      activeIndex >= 0 && state.activeItem
        ? `${activeIndex}:${state.activeItem.label}`
        : undefined

    return (
      <CommandDialog
        open={quickPickStore.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            quickPickStore.cancel()
          }
        }}
        defaultValue={defaultValue}
      >
        <ValueWatcher onValueChange={handleValueChange} />
        <CommandInput
          placeholder={state.placeholder || 'Type to search...'}
        />
        <CommandList>
          <CommandEmpty>No items found.</CommandEmpty>
          <CommandGroup heading={state.title}>
            {state.items.map((item, index) => (
              <CommandItem
                key={`${item.label}-${index}`}
                value={`${index}:${item.label}`}
                keywords={[item.description || '', item.detail || '']}
                onSelect={() => quickPickStore.accept(item)}
              >
                <div className="flex flex-col w-full">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{item.label}</span>
                    {item.description && (
                      <span className="text-xs text-muted-foreground ml-2">
                        {item.description}
                      </span>
                    )}
                  </div>
                  {item.detail && (
                    <span className="text-xs text-muted-foreground mt-0.5">
                      {item.detail}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    )
  }

  // InputBox mode
  if (state.type === 'inputbox' && state.inputBoxOptions) {
    const options = state.inputBoxOptions

    const handleAccept = () => {
      // Validate input
      if (options.validateInput) {
        const error = options.validateInput(inputValue)
        if (error) {
          setValidationError(error)
          return
        }
      }
      quickPickStore.accept(inputValue)
      setInputValue('')
      setValidationError(null)
    }

    const handleCancel = () => {
      quickPickStore.cancel()
      setInputValue('')
      setValidationError(null)
    }

    return (
      <CommandDialog
        open={quickPickStore.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCancel()
          }
        }}
      >
        <div className="p-4">
          {options.title && (
            <h3 className="text-sm font-medium mb-2">{options.title}</h3>
          )}
          {options.prompt && (
            <p className="text-xs text-muted-foreground mb-3">
              {options.prompt}
            </p>
          )}
          <input
            type="text"
            className="w-full px-3 py-2 text-sm border rounded-md outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={options.placeholder}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
              setValidationError(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAccept()
              } else if (e.key === 'Escape') {
                e.preventDefault()
                handleCancel()
              }
            }}
            autoFocus
          />
          {validationError && (
            <p className="text-xs text-red-500 mt-2">{validationError}</p>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAccept}
              className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              OK
            </button>
          </div>
        </div>
      </CommandDialog>
    )
  }

  return null
})

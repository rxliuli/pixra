import { observer } from 'mobx-react-lite'
import { quickPickStore } from './QuickPickStore'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { useState } from 'react'

export const QuickPick = observer(() => {
  const state = quickPickStore.currentState
  const [inputValue, setInputValue] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  if (!quickPickStore.isOpen || !state) {
    return null
  }

  // QuickPick mode
  if (state.type === 'quickpick' && state.items) {
    return (
      <CommandDialog
        open={quickPickStore.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            quickPickStore.cancel()
          }
        }}
      >
        <CommandInput
          placeholder={state.placeholder || 'Type to search...'}
        />
        <CommandList>
          <CommandEmpty>No items found.</CommandEmpty>
          <CommandGroup heading={state.title}>
            {state.items.map((item, index) => (
              <CommandItem
                key={`${item.label}-${index}`}
                value={`${item.label} ${item.description || ''} ${item.detail || ''}`}
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
            <p className="text-xs text-muted-foreground mb-3">{options.prompt}</p>
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

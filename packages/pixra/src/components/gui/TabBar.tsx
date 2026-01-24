import { observer } from 'mobx-react-lite'
import { appStateStore } from '../store'
import { X } from 'lucide-react'
import { actionRegistry } from '../actions'
import { ui } from '@/lib/window'

export const TabBar = observer(function TabBar() {
  const { tabStore } = appStateStore
  const tabs = tabStore.tabList
  const activeId = tabStore.activeTabId

  if (!tabStore.hasTabs) {
    return null
  }

  const handleCloseTab = async (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation()
    const tab = tabStore.tabs.get(tabId)
    if (!tab) return

    if (tab.isDirty) {
      const result = await ui.showQuickPick(
        [
          { label: 'Save', value: 'save' },
          { label: "Don't Save", value: 'discard' },
          { label: 'Cancel', value: 'cancel' },
        ],
        { title: `Save changes to "${tab.name}"?` }
      )

      if (!result || result.value === 'cancel') return
      if (result.value === 'save') {
        await actionRegistry.executeCommand('file.save')
      }
    }

    tabStore.closeTab(tabId)
  }

  return (
    <div className="flex h-9 bg-gray-100 border-b overflow-x-auto">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => tabStore.switchTab(tab.id)}
          className={`
            flex items-center gap-1 px-3 py-1.5 border-r cursor-pointer
            min-w-[120px] max-w-[200px] select-none
            ${
              activeId === tab.id
                ? 'bg-white border-b-2 border-b-white'
                : 'bg-gray-50 hover:bg-gray-100'
            }
          `}
        >
          <span className="truncate flex-1 text-sm">
            {tab.isDirty && <span className="text-gray-500 mr-1">●</span>}
            {tab.name || 'Untitled'}
          </span>
          <button
            onClick={(e) => handleCloseTab(e, tab.id)}
            className="p-0.5 hover:bg-gray-200 rounded opacity-60 hover:opacity-100"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
})

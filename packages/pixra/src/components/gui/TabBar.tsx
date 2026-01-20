import { observer } from 'mobx-react-lite'
import { appStateStore } from '../store'
import { X } from 'lucide-react'
import { actionRegistry } from '../actions'

export const TabBar = observer(function TabBar() {
  const { documentStore } = appStateStore
  const documents = documentStore.documentList
  const activeId = documentStore.activeDocumentId

  if (!documentStore.hasDocuments) {
    return null
  }

  const handleCloseTab = async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation()
    const doc = documentStore.documents.get(docId)
    if (!doc) return

    if (doc.isDirty) {
      const result = await appStateStore.quickPickStore.showQuickPick(
        [
          { label: 'Save', value: 'save' },
          { label: "Don't Save", value: 'discard' },
          { label: 'Cancel', value: 'cancel' },
        ],
        { title: `Save changes to "${doc.name}"?` }
      )

      if (!result || result.value === 'cancel') return
      if (result.value === 'save') {
        await actionRegistry.executeCommand('file.save')
      }
    }

    documentStore.closeDocument(docId)
  }

  return (
    <div className="flex h-9 bg-gray-100 border-b overflow-x-auto">
      {documents.map((doc) => (
        <div
          key={doc.id}
          onClick={() => documentStore.switchDocument(doc.id)}
          className={`
            flex items-center gap-1 px-3 py-1.5 border-r cursor-pointer
            min-w-[120px] max-w-[200px] select-none
            ${
              activeId === doc.id
                ? 'bg-white border-b-2 border-b-white'
                : 'bg-gray-50 hover:bg-gray-100'
            }
          `}
        >
          <span className="truncate flex-1 text-sm">
            {doc.isDirty && <span className="text-gray-500 mr-1">●</span>}
            {doc.name || 'Untitled'}
          </span>
          <button
            onClick={(e) => handleCloseTab(e, doc.id)}
            className="p-0.5 hover:bg-gray-200 rounded opacity-60 hover:opacity-100"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
})

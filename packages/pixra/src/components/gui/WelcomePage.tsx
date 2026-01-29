import { useState, useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { actionRegistry } from '../actions'
import { openFiles } from '../commands/file-open'

export const WelcomePage = observer(function WelcomePage() {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith('image/'),
    )

    if (files.length > 0) {
      await openFiles(files.map((file) => ({ file, handle: null })))
    }
  }, [])

  return (
    <div
      className={`flex-1 flex items-center justify-center bg-secondary transition-colors ${
        isDragging ? 'bg-accent border-2 border-dashed border-primary' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2">Pixra</h1>
        <p className="text-muted-foreground mb-8">Image Editor</p>

        <div className="space-y-3 w-64 mx-auto">
          <button
            onClick={() => actionRegistry.executeCommand('file.open')}
            className="block w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Open Image
          </button>
          <button
            onClick={() => actionRegistry.executeCommand('file.new')}
            className="block w-full px-6 py-3 border border-border text-foreground rounded-lg hover:bg-accent transition-colors"
          >
            New Document
          </button>
        </div>

        <div className="mt-8 text-sm text-muted-foreground">
          <p>Drag & drop images here to open</p>
          <p className="mt-1">Ctrl+O to open, Ctrl+N for new</p>
        </div>
      </div>
    </div>
  )
})

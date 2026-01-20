import { observer } from 'mobx-react-lite'
import { actionRegistry } from '../actions'

export const WelcomePage = observer(function WelcomePage() {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-700 mb-2">Pixra</h1>
        <p className="text-gray-500 mb-8">Image Editor</p>

        <div className="space-y-3 w-64 mx-auto">
          <button
            onClick={() => actionRegistry.executeCommand('file.open')}
            className="block w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Open Image
          </button>
          <button
            onClick={() => actionRegistry.executeCommand('file.new')}
            className="block w-full px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            New Document
          </button>
        </div>

        <div className="mt-8 text-sm text-gray-400">
          <p>Drag & drop images here to open</p>
          <p className="mt-1">Ctrl+O to open, Ctrl+N for new</p>
        </div>
      </div>
    </div>
  )
})

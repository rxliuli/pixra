/**
 * Store FileSystemFileHandle for documents
 * Used to save handles when opening files for direct overwrite on subsequent saves
 */

// File System Access API type declarations
declare global {
  interface Window {
    showOpenFilePicker(options?: OpenFilePickerOptions): Promise<FileSystemFileHandle[]>
    showSaveFilePicker(options?: SaveFilePickerOptions): Promise<FileSystemFileHandle>
  }

  interface OpenFilePickerOptions {
    multiple?: boolean
    types?: FilePickerAcceptType[]
  }

  interface SaveFilePickerOptions {
    suggestedName?: string
    types?: FilePickerAcceptType[]
  }

  interface FilePickerAcceptType {
    description?: string
    accept: Record<string, string[]>
  }

  interface FileSystemFileHandle {
    getFile(): Promise<File>
    createWritable(): Promise<FileSystemWritableFileStream>
  }

  interface FileSystemWritableFileStream extends WritableStream {
    write(data: Blob | BufferSource | string): Promise<void>
    close(): Promise<void>
  }
}

const fileHandles = new Map<string, FileSystemFileHandle>()

export function getFileHandle(documentId: string): FileSystemFileHandle | undefined {
  return fileHandles.get(documentId)
}

export function setFileHandle(documentId: string, handle: FileSystemFileHandle): void {
  fileHandles.set(documentId, handle)
}

export function removeFileHandle(documentId: string): void {
  fileHandles.delete(documentId)
}

export function isFileSystemAccessSupported(): boolean {
  return 'showOpenFilePicker' in window && 'showSaveFilePicker' in window
}

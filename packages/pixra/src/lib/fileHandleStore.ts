/**
 * 存储文档的 FileSystemFileHandle
 * 用于在打开文件时保存句柄，以便后续保存时可以直接覆盖原文件
 */

// File System Access API 类型声明
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

// 存储文件句柄的映射（文档 ID -> FileSystemFileHandle）
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

/**
 * 检查浏览器是否支持 File System Access API
 */
export function isFileSystemAccessSupported(): boolean {
  return 'showOpenFilePicker' in window && 'showSaveFilePicker' in window
}

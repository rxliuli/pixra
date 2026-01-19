// https://www.npmjs.com/package/file-saver 确实存在，但作者不在维护，始终不肯接受任何错误修复 PR，有些问题已经存在几年了
export function fileSave(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

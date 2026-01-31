export function fileReadAs(file: Blob, format: 'dataURL'): Promise<string>
export function fileReadAs(
  file: Blob,
  format: 'arrayBuffer',
): Promise<ArrayBuffer>
export function fileReadAs(file: Blob, format: 'text'): Promise<string>
export function fileReadAs(
  file: Blob,
  format: 'dataURL' | 'arrayBuffer' | 'text',
): Promise<string | ArrayBuffer | null> {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader()
    reader.onload = function (e) {
      resolve(e.target?.result ?? null)
    }
    reader.onerror = function (e) {
      reject(new Error('Error reading blob: ' + e.target?.result))
    }
    if (format === 'dataURL') {
      reader.readAsDataURL(file)
    } else if (format === 'arrayBuffer') {
      reader.readAsArrayBuffer(file)
    } else if (format === 'text') {
      reader.readAsText(file)
    } else {
      throw new Error('Unsupported format: ' + format)
    }
  })
}

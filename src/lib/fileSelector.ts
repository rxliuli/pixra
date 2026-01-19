export async function fileSelector(options?: {
  accept?: string
  multiple?: boolean
}): Promise<FileList | null> {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = options?.accept || 'image/png, image/jpeg'
  input.multiple = options?.multiple || false

  // Safari requires the file input to be attached to the DOM for the change event to fire reliably.
  // This is a known WebKit issue, particularly on iOS Safari.
  // See: https://github.com/GoogleChromeLabs/browser-fs-access/issues/107#issuecomment-1115243883
  input.style.display = 'none'
  document.body.appendChild(input)

  return await new Promise<FileList | null>((resolve) => {
    let resolved = false

    const cleanup = () => {
      if (!resolved) {
        resolved = true
        setTimeout(() => {
          input.remove()
        }, 100)
      }
    }

    input.addEventListener('change', () => {
      cleanup()
      resolve(input.files)
    })

    input.addEventListener('cancel', () => {
      cleanup()
      resolve(null)
    })

    // Fallback for Safari: when the change event doesn't fire, detect file selection via window focus
    window.addEventListener(
      'focus',
      () => {
        setTimeout(() => {
          if (!resolved && input.files && input.files.length > 0) {
            cleanup()
            resolve(input.files)
          }
        }, 300)
      },
      { once: true },
    )

    input.click()
  })
}
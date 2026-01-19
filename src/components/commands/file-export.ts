import type { BuiltinAction } from '../actions/types'

export function fileExport(): BuiltinAction {
  return {
    command: 'file.export',
    title: 'Export',
    menu: {
      group: 'file',
    },
    // 不确定那种方式更好，VSCode 是怎么做的？
    submenu: [
      {
        command: 'file.export.png',
        title: 'Export as PNG',
        execute: () => {},
        menu: {
          group: 'file.export',
        },
      },
      {
        command: 'file.export.jpg',
        title: 'Export as JPG',
        execute: () => {},
        menu: {
          group: 'file.export',
        },
      },
    ],
    execute: (command) => {
      switch (command) {
        case 'file.export.png':
          console.log('Exporting as PNG...')
          break
        case 'file.export.jpg':
          console.log('Exporting as JPG...')
          break
        default:
          throw new Error(`Unknown export command: ${command}`)
      }
    },
  }
}

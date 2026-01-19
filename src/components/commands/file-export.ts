import type { BuiltinAction } from '../actions/types'

export function fileExport(): BuiltinAction {
  return {
    command: 'file.export',
    title: 'Export',
    menu: {
      group: 'file',
    },
    submenu: [
      {
        command: 'file.export.png',
        title: 'Export as PNG',
        execute: () => {
          console.log('Export as PNG')
        },
        menu: {
          group: 'file.export',
        },
      },
      {
        command: 'file.export.jpg',
        title: 'Export as JPG',
        execute: () => {
          console.log('Export as JPG')
        },
        menu: {
          group: 'file.export',
        },
      },
    ],
  }
}

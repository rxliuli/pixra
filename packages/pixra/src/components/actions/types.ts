export interface CommandRegistry {
  command: string
  title: string
}

export interface MenuRegistry {}

export interface Command {
  command: string
  title: string
  enablement?: string
  execute: () => void | Promise<void>
}

export interface Keybinding {
  commandId: string
  key: string
  mac?: string
}

export interface MenuItem {
  type?: 'item' | 'separator' | 'submenu'
  command?: string
  title?: string
  submenu?: MenuItem[]
}

export interface MenuGroup {
  id: string
  title: string
  items: MenuItem[]
}

export type BuiltinActionSingle = {
  command: string
  title: string
  enablement?: string
  execute: () => void | Promise<void>
  keybinding?: Omit<Keybinding, 'commandId'>
  menu: {
    group: string
    order?: number
  }
}
type BuiltinActionGroup = {
  command: string
  title: string
  submenu: BuiltinAction[]
  menu: {
    group: string
    order?: number
  }
}
export type BuiltinAction = BuiltinActionSingle | BuiltinActionGroup

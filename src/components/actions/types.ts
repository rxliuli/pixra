export interface CommandRegistry {
  command: string
  title: string
}

export interface MenuRegistry {

}
// 命令定义
export interface Command {
  id: string
  label: string
  execute: () => void | Promise<void>
}

// 快捷键定义
export interface Keybinding {
  commandId: string
  key: string // Windows/Linux
  mac?: string // macOS
  when?: string // 条件表达式
}

// 菜单项定义
export interface MenuItem {
  type?: 'item' | 'separator' | 'submenu'
  commandId?: string
  label?: string
  submenu?: MenuItem[]
}

// 菜单组定义
export interface MenuGroup {
  id: string
  label: string
  items: MenuItem[]
}

// 完整 Action 定义（便捷集成用）
export interface Action {
  id: string
  label: string
  execute: () => void | Promise<void>
  keybinding?: Omit<Keybinding, 'commandId'>
  menu?: {
    group: string // 菜单组 ID，如 'file', 'edit'
    order?: number // 在菜单组中的顺序
  }
}

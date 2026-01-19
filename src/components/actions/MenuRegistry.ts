import { makeAutoObservable } from 'mobx'
import type { MenuGroup, MenuItem } from './types'

/**
 * 菜单注册中心
 * 负责管理顶部菜单栏结构
 */
export class MenuRegistry {
  private menuGroups = new Map<string, MenuGroup>()
  private groupOrder: string[] = []

  constructor() {
    makeAutoObservable(this)
  }

  /**
   * 注册菜单组
   */
  registerMenuGroup(group: MenuGroup, order?: number): void {
    this.menuGroups.set(group.id, group)
    
    // 管理菜单组顺序
    const index = this.groupOrder.indexOf(group.id)
    if (index !== -1) {
      this.groupOrder.splice(index, 1)
    }
    
    if (order !== undefined) {
      this.groupOrder.splice(order, 0, group.id)
    } else {
      this.groupOrder.push(group.id)
    }
  }

  /**
   * 向已有菜单组添加菜单项
   */
  addMenuItem(groupId: string, item: MenuItem, order?: number): void {
    const group = this.menuGroups.get(groupId)
    if (!group) {
      console.warn(`Menu group ${groupId} not found`)
      return
    }

    if (order !== undefined) {
      group.items.splice(order, 0, item)
    } else {
      group.items.push(item)
    }
  }

  /**
   * 获取菜单组
   */
  getMenuGroup(groupId: string): MenuGroup | undefined {
    return this.menuGroups.get(groupId)
  }

  /**
   * 获取所有菜单组（按顺序）
   */
  getAllMenuGroups(): MenuGroup[] {
    return this.groupOrder
      .map((id) => this.menuGroups.get(id))
      .filter((group): group is MenuGroup => group !== undefined)
  }

  /**
   * 移除菜单组
   */
  removeMenuGroup(groupId: string): void {
    this.menuGroups.delete(groupId)
    const index = this.groupOrder.indexOf(groupId)
    if (index !== -1) {
      this.groupOrder.splice(index, 1)
    }
  }

  /**
   * 移除菜单项
   */
  removeMenuItem(groupId: string, commandId: string): void {
    const group = this.menuGroups.get(groupId)
    if (!group) return

    const index = group.items.findIndex(
      (item) => item.commandId === commandId
    )
    if (index !== -1) {
      group.items.splice(index, 1)
    }
  }
}

// 导出单例
export const menuRegistry = new MenuRegistry()

import { makeAutoObservable } from 'mobx'
import type { MenuGroup, MenuItem } from './types'

/**
 * Menu Registry
 * Manages top menu bar structure
 */
export class MenuRegistry {
  private menuGroups = new Map<string, MenuGroup>()
  private groupOrder: string[] = []

  constructor() {
    makeAutoObservable(this)
  }

  registerMenuGroup(group: MenuGroup, order?: number): void {
    this.menuGroups.set(group.id, group)

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

  getMenuGroup(groupId: string): MenuGroup | undefined {
    return this.menuGroups.get(groupId)
  }

  getAllMenuGroups(): MenuGroup[] {
    return this.groupOrder
      .map((id) => this.menuGroups.get(id))
      .filter((group): group is MenuGroup => group !== undefined)
  }

  removeMenuGroup(groupId: string): void {
    this.menuGroups.delete(groupId)
    const index = this.groupOrder.indexOf(groupId)
    if (index !== -1) {
      this.groupOrder.splice(index, 1)
    }
  }

  removeMenuItem(groupId: string, commandId: string): void {
    const group = this.menuGroups.get(groupId)
    if (!group) return

    const index = group.items.findIndex(
      (item) => item.command === commandId
    )
    if (index !== -1) {
      group.items.splice(index, 1)
    }
  }
}

export const menuRegistry = new MenuRegistry()

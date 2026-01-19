import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
  MenubarShortcut,
} from '@/components/ui/menubar'
import { observer } from 'mobx-react-lite'
import { actionRegistry } from '../actions/ActionRegistry'
import type { MenuItem, MenuGroup } from '../actions/types'

function renderMenuItem(
  item: MenuItem,
  onExecute: (commandId: string) => void
): React.ReactNode {
  if (item.type === 'separator') {
    return <MenubarSeparator key={`sep-${Math.random()}`} />
  }

  if (item.type === 'submenu' && item.submenu) {
    return (
      <MenubarSub key={item.label}>
        <MenubarSubTrigger>{item.label}</MenubarSubTrigger>
        <MenubarSubContent>
          {item.submenu.map((subItem) => renderMenuItem(subItem, onExecute))}
        </MenubarSubContent>
      </MenubarSub>
    )
  }

  // 普通菜单项
  if (item.commandId) {
    const command = actionRegistry.getCommandRegistry().getCommand(item.commandId)
    const keybindings = actionRegistry
      .getKeybindingRegistry()
      .getKeybindings(item.commandId)
    const shortcut = keybindings[0]
      ? actionRegistry.getKeybindingRegistry().formatKeybinding(keybindings[0])
      : undefined

    return (
      <MenubarItem
        key={item.commandId}
        onClick={() => onExecute(item.commandId!)}
        disabled={!command}
      >
        {item.label || command?.label}
        {shortcut && <MenubarShortcut>{shortcut}</MenubarShortcut>}
      </MenubarItem>
    )
  }

  return null
}

export const Toolbar = observer(function Toolbar() {
  const menuGroups = actionRegistry.getMenuRegistry().getAllMenuGroups()

  const handleExecute = (commandId: string) => {
    actionRegistry.executeCommand(commandId)
  }

  return (
    <Menubar className={'border-none'}>
      {menuGroups.map((group: MenuGroup) => (
        <MenubarMenu key={group.id}>
          <MenubarTrigger>{group.label}</MenubarTrigger>
          <MenubarContent>
            {group.items.map((item: MenuItem) => renderMenuItem(item, handleExecute))}
          </MenubarContent>
        </MenubarMenu>
      ))}
    </Menubar>
  )
})

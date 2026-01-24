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
      <MenubarSub key={item.title}>
        <MenubarSubTrigger>{item.title}</MenubarSubTrigger>
        <MenubarSubContent>
          {item.submenu.map((subItem) => renderMenuItem(subItem, onExecute))}
        </MenubarSubContent>
      </MenubarSub>
    )
  }

  // 普通菜单项
  if (item.command) {
    const commandRegistry = actionRegistry.getCommandRegistry()
    const command = commandRegistry.getCommand(item.command)
    const isEnabled = commandRegistry.isCommandEnabled(item.command)
    const keybindings = actionRegistry
      .getKeybindingRegistry()
      .getKeybindings(item.command)
    const shortcut = keybindings[0]
      ? actionRegistry.getKeybindingRegistry().formatKeybinding(keybindings[0])
      : undefined

    return (
      <MenubarItem
        key={item.command}
        onClick={() => onExecute(item.command!)}
        disabled={!command || !isEnabled}
      >
        {item.title || command?.title}
        {shortcut && <MenubarShortcut>{shortcut}</MenubarShortcut>}
      </MenubarItem>
    )
  }

  return null
}

export const Toolbar = observer(function Toolbar() {
  const menuGroups = actionRegistry
    .getMenuRegistry()
    .getAllMenuGroups()
    .filter((group) => group.items.length > 0)

  const handleExecute = (commandId: string) => {
    actionRegistry.executeCommand(commandId)
  }

  return (
    <Menubar className={'rounded-none'}>
      {menuGroups.map((group: MenuGroup) => (
        <MenubarMenu key={group.id}>
          <MenubarTrigger>{group.title}</MenubarTrigger>
          <MenubarContent>
            {group.items.map((item: MenuItem) => renderMenuItem(item, handleExecute))}
          </MenubarContent>
        </MenubarMenu>
      ))}
    </Menubar>
  )
})

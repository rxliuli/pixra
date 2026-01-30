import { reaction } from 'mobx'
import { contextKeyService } from './ContextKeyService'
import { appStateStore } from '../store'

/**
 * Context Key Synchronizer
 * Automatically syncs application state to ContextKeyService
 */
export function setupContextKeySynchronizer(): () => void {
  const disposers: (() => void)[] = []

  const { tabStore } = appStateStore

  disposers.push(
    reaction(
      () => tabStore.activeTab !== null,
      (hasActiveTab) => {
        contextKeyService.set('hasActiveTab', hasActiveTab)
      },
      { fireImmediately: true },
    ),
  )

  disposers.push(
    reaction(
      () => tabStore.canUndo,
      (canUndo) => {
        contextKeyService.set('canUndo', canUndo)
      },
      { fireImmediately: true },
    ),
  )

  disposers.push(
    reaction(
      () => tabStore.canRedo,
      (canRedo) => {
        contextKeyService.set('canRedo', canRedo)
      },
      { fireImmediately: true },
    ),
  )

  disposers.push(
    reaction(
      () => tabStore.activeTab?.isDirty ?? false,
      (hasUnsavedChanges) => {
        contextKeyService.set('hasUnsavedChanges', hasUnsavedChanges)
      },
      { fireImmediately: true },
    ),
  )

  disposers.push(
    reaction(
      () => tabStore.tabs.size,
      (tabCount) => {
        contextKeyService.set('tabCount', tabCount)
      },
      { fireImmediately: true },
    ),
  )

  return () => {
    disposers.forEach((dispose) => dispose())
  }
}

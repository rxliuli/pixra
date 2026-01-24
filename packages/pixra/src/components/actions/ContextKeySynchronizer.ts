import { reaction } from 'mobx'
import { contextKeyService } from './ContextKeyService'
import { appStateStore } from '../store'

/**
 * 上下文键同步器
 * 将应用状态自动同步到 ContextKeyService
 */
export function setupContextKeySynchronizer(): () => void {
  const disposers: (() => void)[] = []

  const { tabStore } = appStateStore

  // 同步 hasActiveTab
  disposers.push(
    reaction(
      () => tabStore.activeTab !== null,
      (hasActiveTab) => {
        contextKeyService.set('hasActiveTab', hasActiveTab)
      },
      { fireImmediately: true },
    ),
  )

  // 同步 canUndo
  disposers.push(
    reaction(
      () => tabStore.canUndo,
      (canUndo) => {
        contextKeyService.set('canUndo', canUndo)
      },
      { fireImmediately: true },
    ),
  )

  // 同步 canRedo
  disposers.push(
    reaction(
      () => tabStore.canRedo,
      (canRedo) => {
        contextKeyService.set('canRedo', canRedo)
      },
      { fireImmediately: true },
    ),
  )

  // 同步 hasUnsavedChanges
  disposers.push(
    reaction(
      () => tabStore.activeTab?.isDirty ?? false,
      (hasUnsavedChanges) => {
        contextKeyService.set('hasUnsavedChanges', hasUnsavedChanges)
      },
      { fireImmediately: true },
    ),
  )

  // 同步 tabCount
  disposers.push(
    reaction(
      () => tabStore.tabs.size,
      (tabCount) => {
        contextKeyService.set('tabCount', tabCount)
      },
      { fireImmediately: true },
    ),
  )

  // 返回清理函数
  return () => {
    disposers.forEach((dispose) => dispose())
  }
}

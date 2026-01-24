import { reaction } from 'mobx'
import { contextKeyService } from './ContextKeyService'
import { appStateStore } from '../store'

/**
 * 上下文键同步器
 * 将应用状态自动同步到 ContextKeyService
 */
export function setupContextKeySynchronizer(): () => void {
  const disposers: (() => void)[] = []

  const { documentStore } = appStateStore

  // 同步 hasActiveDocument
  disposers.push(
    reaction(
      () => documentStore.activeDocument !== null,
      (hasActiveDocument) => {
        contextKeyService.set('hasActiveDocument', hasActiveDocument)
      },
      { fireImmediately: true },
    ),
  )

  // 同步 canUndo
  disposers.push(
    reaction(
      () => documentStore.canUndo,
      (canUndo) => {
        contextKeyService.set('canUndo', canUndo)
      },
      { fireImmediately: true },
    ),
  )

  // 同步 canRedo
  disposers.push(
    reaction(
      () => documentStore.canRedo,
      (canRedo) => {
        contextKeyService.set('canRedo', canRedo)
      },
      { fireImmediately: true },
    ),
  )

  // 同步 hasUnsavedChanges
  disposers.push(
    reaction(
      () => documentStore.activeDocument?.isDirty ?? false,
      (hasUnsavedChanges) => {
        contextKeyService.set('hasUnsavedChanges', hasUnsavedChanges)
      },
      { fireImmediately: true },
    ),
  )

  // 同步 documentCount
  disposers.push(
    reaction(
      () => documentStore.documents.size,
      (documentCount) => {
        contextKeyService.set('documentCount', documentCount)
      },
      { fireImmediately: true },
    ),
  )

  // 返回清理函数
  return () => {
    disposers.forEach((dispose) => dispose())
  }
}

import { observer } from 'mobx-react-lite'
import { dialogStore } from './DialogStore'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Suspense } from 'react'

export const DialogHost = observer(() => {
  const state = dialogStore.currentState

  if (!dialogStore.isOpen || !state) {
    return null
  }

  const { Component, options } = state
  const { title, description, footer = true, props, className } = options

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      dialogStore.cancel()
    }
  }

  return (
    <Dialog open={dialogStore.isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className={className}>
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
        )}

        <Suspense>
          <Component {...props} />
        </Suspense>

        {footer && (
          <DialogFooter>
            <Button variant="outline" onClick={() => dialogStore.cancel()}>
              Cancel
            </Button>
            <Button onClick={() => dialogStore.accept()}>OK</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
})

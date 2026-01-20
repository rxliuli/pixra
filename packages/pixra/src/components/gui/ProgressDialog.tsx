import { observer } from 'mobx-react-lite'
import { appStateStore } from '../store'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export const ProgressDialog = observer(() => {
  const { progressStore } = appStateStore
  const state = progressStore.currentState

  if (!state) return null

  return (
    <Dialog open={progressStore.isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{state.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {state.message && (
            <p className="text-sm text-muted-foreground">{state.message}</p>
          )}
          {state.percentage !== undefined && (
            <div className="space-y-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${state.percentage}%` }}
                />
              </div>
              <p className="text-xs text-center text-muted-foreground">
                {Math.round(state.percentage)}%
              </p>
            </div>
          )}
          {state.cancellable && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => progressStore.cancel()}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
})

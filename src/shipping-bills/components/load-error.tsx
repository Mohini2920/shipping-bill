import { describeError } from 'core/utils'
import { Button } from 'ui/basic/button'
import { AlertDanger } from 'ui/notify/alert'

interface LoadErrorProps {
  error: unknown
  onRetry: () => void
  retrying?: boolean
}

/** Shown when data needed by a page could not be loaded. */
export function LoadError({ error, onRetry, retrying }: LoadErrorProps) {
  const { message, description } = describeError(error)

  return (
    <div className="space-y-3">
      <AlertDanger title={message} description={description} />
      <Button variant="outline" onClick={onRetry} loading={retrying} disabled={retrying}>
        Try again
      </Button>
    </div>
  )
}

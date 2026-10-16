import { clsxJoin } from 'ui/utils'
import { workflowSteps } from '../workflow'

/** The export job's stages, with the shipping bill step highlighted. */
export function WorkflowSteps() {
  return (
    <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {workflowSteps.map((step, index) => {
        const isCurrent = step.id === 'shipping-bill'
        return (
          <li
            key={step.id}
            aria-current={isCurrent ? 'step' : undefined}
            className={clsxJoin('rounded-lg border p-3', isCurrent && 'border-primary-500')}>
            <div className="flex items-center gap-2 text-sm font-medium">
              <span
                className={clsxJoin(
                  'flex size-6 items-center justify-center rounded-full border text-xs',
                  isCurrent && 'bg-primary-600 border-primary-600 text-white'
                )}>
                {index + 1}
              </span>
              {step.title}
            </div>
            <p className="ml-8 text-xs text-gray-500">{step.description}</p>
          </li>
        )
      })}
    </ol>
  )
}

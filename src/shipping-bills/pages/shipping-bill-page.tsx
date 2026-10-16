import { routes } from '@/shared/route-paths'
import { useQuery } from 'core/react-query'
import { navigate, useParams } from 'core/routing'
import { InternalError } from 'core/utils'
import { Button } from 'ui/basic/button'
import { Skeleton } from 'ui/notify/skeleton'
import { billService, referenceDataService } from '../api'
import { queryKeys } from '../api/query-keys'
import { LoadError } from '../components/load-error'
import { FormOptionsContext } from '../hooks/form-options-context'
import { BillEditor } from './bill-editor'

/**
 * Route component for /shipping-bills/new and /shipping-bills/:id. Loads the bill (when editing)
 * and the form's option lists, and shows loading, not-found and error states until both are ready.
 */
export default function ShippingBillPage() {
  const { id } = useParams<{ id?: string }>()
  const billId = id == null ? undefined : Number(id)
  const isValidId = billId == null || Number.isInteger(billId)

  const billQuery = useQuery({
    queryKey: queryKeys.bill(billId ?? -1),
    queryFn: () => billService.get(billId!),
    enabled: billId != null && isValidId
  })
  const optionsQuery = useQuery({
    queryKey: queryKeys.formOptions,
    queryFn: () => referenceDataService.getFormOptions()
  })

  const notFound = !isValidId || (billQuery.error instanceof InternalError && billQuery.error.status === 404)
  if (notFound) {
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-semibold">Shipping bill not found</h1>
        <Button onClick={() => navigate(routes.dashboard)}>Back to list</Button>
      </div>
    )
  }

  const bill = billQuery.data
  const options = optionsQuery.data
  // Keep showing the editor if a background refetch fails later; only block on the first load.
  if (options != null && (billId == null || bill != null)) {
    return (
      <FormOptionsContext.Provider value={options}>
        <BillEditor key={billId ?? 'new'} bill={bill} />
      </FormOptionsContext.Provider>
    )
  }

  const error = billQuery.error ?? optionsQuery.error
  if (error != null) {
    return (
      <LoadError
        error={error}
        retrying={billQuery.isFetching || optionsQuery.isFetching}
        onRetry={() => {
          if (billId != null) void billQuery.refetch()
          void optionsQuery.refetch()
        }}
      />
    )
  }

  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading shipping bill">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  )
}

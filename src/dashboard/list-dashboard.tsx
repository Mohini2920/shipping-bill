import { downloadTextFile } from '@/shared/download'
import { routes } from '@/shared/route-paths'
import { billService } from '@/shipping-bills/api'
import { queryKeys } from '@/shipping-bills/api/query-keys'
import { LoadError } from '@/shipping-bills/components/load-error'
import { formatAmount } from '@/shipping-bills/domain/calculations'
import type { ShippingBillSummary } from '@/shipping-bills/domain/types'
import { useQuery } from 'core/react-query'
import { navigate } from 'core/routing'
import { toast } from 'core/toast-manager'
import { describeError } from 'core/utils'
import { useState } from 'react'
import { Badge } from 'ui/basic/badge'
import { Button } from 'ui/basic/button'
import { Card, CardContent } from 'ui/basic/card'
import { Table } from 'ui/basic/table'
import { Input } from 'ui/inputs/input'
import { AlertDanger } from 'ui/notify/alert'
import { Skeleton } from 'ui/notify/skeleton'

function matchesSearch(bill: ShippingBillSummary, search: string) {
  const text = [bill.id, bill.jobNumber, bill.exporterName, bill.consigneeName, ...bill.invoiceNumbers]
    .join(' ')
    .toLowerCase()
  return text.includes(search.trim().toLowerCase())
}

function countDistinct(values: (string | undefined)[]) {
  return new Set(values.filter(Boolean)).size
}

function formatDate(iso: string) {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString()
}

export default function ListDashboard() {
  const billsQuery = useQuery({ queryKey: queryKeys.bills, queryFn: () => billService.list() })
  const [search, setSearch] = useState('')
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  const bills = billsQuery.data ?? []
  const filtered = bills
    .filter((bill) => matchesSearch(bill, search))
    .sort((a, b) => b.updated.localeCompare(a.updated))

  async function downloadFlatFile(bill: ShippingBillSummary) {
    setDownloadingId(bill.id)
    try {
      const file = await billService.getFlatFile(bill.id)
      downloadTextFile(file.filename, file.content)
      toast.success(`Flat file downloaded for #${bill.jobNumber ?? bill.id}`)
    } catch (error) {
      const { message, description } = describeError(error)
      toast.error(`Flat file not downloaded: ${message}`, { description })
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Shipping bills</h1>
          <p className="mt-1 text-sm text-gray-500">Create and continue the shipping bill step of each export job.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void billsQuery.refetch()}
            loading={billsQuery.isFetching}
            disabled={billsQuery.isFetching}>
            Refresh
          </Button>
          <Button onClick={() => navigate(routes.shippingBillNew)}>+ New shipping bill</Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Shipping bills" value={bills.length} />
        <StatCard label="Exporters" value={countDistinct(bills.map((bill) => bill.exporterName))} />
        <StatCard label="Consignees" value={countDistinct(bills.map((bill) => bill.consigneeName))} />
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          {/* A failed refresh keeps the last loaded list on screen and says it may be stale. */}
          {billsQuery.isError && billsQuery.data != null && (
            <AlertDanger title="Could not refresh the list" description="Showing the last loaded data." />
          )}
          <div className="flex flex-wrap items-end justify-between gap-3">
            <Input
              label="Search bills"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Job, invoice, exporter or consignee"
              wrapClass="w-full max-w-sm"
            />
            <span className="text-sm text-gray-500">
              {filtered.length} {filtered.length === 1 ? 'bill' : 'bills'}
            </span>
          </div>

          {billsQuery.isPending ? (
            <div className="space-y-2" aria-busy="true" aria-label="Loading shipping bills">
              {[0, 1, 2].map((row) => (
                <Skeleton key={row} className="h-12 w-full" />
              ))}
            </div>
          ) : billsQuery.isError && billsQuery.data == null ? (
            <LoadError
              error={billsQuery.error}
              onRetry={() => void billsQuery.refetch()}
              retrying={billsQuery.isFetching}
            />
          ) : filtered.length === 0 ? (
            <EmptyState isSearching={search.trim() !== ''} />
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Exporter → Consignee</th>
                  <th>Route</th>
                  <th>Invoices</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((bill) => (
                  <tr key={bill.id}>
                    <td className="font-medium">
                      {bill.jobNumber != null ? `#${bill.jobNumber}` : `Bill #${bill.id}`}
                      <span className="block text-xs font-normal text-gray-500">{bill.jobDate}</span>
                    </td>
                    <td>
                      {bill.exporterName ?? '—'}
                      <span className="block text-xs text-gray-500">to {bill.consigneeName ?? '—'}</span>
                    </td>
                    <td>
                      {bill.loadingPort || '—'} → {bill.finalDestinationPort || '—'}
                    </td>
                    <td>
                      {bill.invoiceNumbers.length}
                      {bill.totalValue != null && (
                        <span className="block text-xs text-gray-500">{formatAmount(bill.totalValue)} in total</span>
                      )}
                    </td>
                    <td>
                      <Badge variant="secondary">Draft</Badge>
                    </td>
                    <td>{formatDate(bill.updated)}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          loading={downloadingId === bill.id}
                          disabled={downloadingId === bill.id}
                          onClick={() => void downloadFlatFile(bill)}>
                          Flat file
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(routes.toShippingBillEdit(bill.id))}>
                          Open
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  )
}

function EmptyState({ isSearching }: { isSearching: boolean }) {
  return (
    <div className="rounded-lg border border-dashed p-10 text-center">
      <p className="font-medium">{isSearching ? 'No matching shipping bills' : 'No shipping bills yet'}</p>
      <p className="mt-1 text-sm text-gray-500">
        {isSearching ? 'Try another job number or party name.' : 'Create a bill to start an export job.'}
      </p>
      {!isSearching && (
        <Button className="mt-4" onClick={() => navigate(routes.shippingBillNew)}>
          Create shipping bill
        </Button>
      )}
    </div>
  )
}

import { routes } from '@/shared/route-paths'
import { useForm } from 'core/form'
import { Form } from 'core/form/components'
import { queryClient } from 'core/react-query'
import { navigate } from 'core/routing'
import { toast } from 'core/toast-manager'
import { describeError } from 'core/utils'
import { useEffect, useRef, useState } from 'react'
import { Button } from 'ui/basic/button'
import { Tabs, TabsList, TabsTrigger } from 'ui/interactive/tabs'
import { billService, usesMockBillApi } from '../api'
import { queryKeys } from '../api/query-keys'
import { DetailsTab } from '../components/details-tab'
import { TabPanel } from '../components/form-layout'
import { InvoicesTab } from '../components/invoices-tab'
import { OthersTab } from '../components/others-tab'
import { WorkflowSteps } from '../components/workflow-steps'
import { emptyBill } from '../domain/defaults'
import type { SavedBill, ShippingBillFormValues } from '../domain/types'
import { billSchema } from '../domain/validation'
import { BillTabId, billTabs, fieldsOfTab, nextTab, previousTab, tabOfField } from './bill-tabs'

const savedDescription = usesMockBillApi ? 'Stored by the mock API in this browser.' : undefined

interface BillEditorProps {
  /** Undefined when creating a new bill. */
  bill?: SavedBill
}

/** Owns the form state and the save flow. Sections render fields and read the form from context. */
export function BillEditor({ bill }: BillEditorProps) {
  const formCtx = useForm<ShippingBillFormValues>(billSchema, { defaultValues: bill?.values ?? emptyBill() })
  const { formState, trigger, getValues, setError, reset } = formCtx.hooks
  const { submitCount, errors, isSubmitting } = formState
  const [activeTab, setActiveTab] = useState<BillTabId>('details')
  // Set by the first save, so later saves (drafts or final) update the same bill.
  const [billId, setBillId] = useState(bill?.id)
  const [isSavingDraft, setIsSavingDraft] = useState(false)

  // After a submit fails validation, open the tab that holds the first invalid field.
  const handledSubmitCount = useRef(0)
  useEffect(() => {
    if (submitCount === handledSubmitCount.current) return
    handledSubmitCount.current = submitCount
    const firstInvalidField = Object.keys(errors).find((field) => field !== 'root')
    if (firstInvalidField != null) {
      setActiveTab(tabOfField(firstInvalidField))
      toast.error('Please fix the highlighted fields')
    }
  }, [submitCount, errors])

  async function persist(values: ShippingBillFormValues) {
    const saved = await billService.save(values, billId)
    setBillId(saved.id)
    queryClient.setQueryData(queryKeys.bill(saved.id), saved)
    void queryClient.invalidateQueries({ queryKey: queryKeys.bills, exact: true })
    return saved
  }

  // <Form> disables every input while this promise is pending, which prevents double submission.
  async function handleSubmit(values: ShippingBillFormValues) {
    try {
      const saved = await persist(values)
      toast.success(`Shipping bill #${saved.values.jobNumber ?? saved.id} saved`, { description: savedDescription })
      if (bill?.id === saved.id) reset(saved.values)
      else navigate(routes.toShippingBillEdit(saved.id))
    } catch (error) {
      // Handled here rather than by <Form>, whose automatic retry could create the bill twice.
      const { message, description } = describeError(error)
      setError('root', { message, type: description })
      toast.error(message, { description })
    }
  }

  async function saveDraftAndContinue() {
    const next = nextTab(activeTab)
    if (next == null) return
    const isTabValid = await trigger(fieldsOfTab(activeTab, getValues()))
    if (!isTabValid) {
      toast.error('Please fix the highlighted fields')
      return
    }
    setIsSavingDraft(true)
    try {
      await persist(getValues())
      toast.success('Draft saved', { description: savedDescription })
      setActiveTab(next)
    } catch (error) {
      const { message, description } = describeError(error)
      toast.error(`Draft not saved: ${message}`, { description })
    } finally {
      setIsSavingDraft(false)
    }
  }

  const isBusy = isSubmitting || isSavingDraft
  const previous = previousTab(activeTab)
  const isLastTab = nextTab(activeTab) == null

  return (
    <div className="space-y-5">
      <div>
        <button className="mb-2 text-sm text-gray-500 hover:underline" onClick={() => navigate(routes.dashboard)}>
          ← Shipping bills
        </button>
        <h1 className="text-2xl font-semibold">
          {bill ? `Shipping bill #${bill.values.jobNumber ?? bill.id}` : 'New shipping bill'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Enter the everyday details first. Open the collapsed sections only when needed.
        </p>
      </div>
      <WorkflowSteps />

      <Form ctx={formCtx} handleSubmit={handleSubmit} className="space-y-5">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as BillTabId)}>
          <TabsList className="flex w-full justify-start overflow-x-auto">
            {billTabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabPanel active={activeTab === 'details'}>
            <DetailsTab />
          </TabPanel>
          <TabPanel active={activeTab === 'invoices'}>
            <InvoicesTab />
          </TabPanel>
          <TabPanel active={activeTab === 'others'}>
            <OthersTab />
          </TabPanel>
        </Tabs>

        <div className="flex flex-wrap justify-between gap-2 border-t pt-4">
          <Button variant="outline" onClick={() => navigate(routes.dashboard)} disabled={isBusy}>
            Cancel
          </Button>
          <div className="flex gap-2">
            {previous != null && (
              <Button variant="outline" onClick={() => setActiveTab(previous)} disabled={isBusy}>
                Previous
              </Button>
            )}
            {isLastTab ? (
              <Button type="submit" loading={isSubmitting} disabled={isBusy}>
                Save shipping bill
              </Button>
            ) : (
              <Button onClick={() => void saveDraftAndContinue()} loading={isSavingDraft} disabled={isBusy}>
                Save & next
              </Button>
            )}
          </div>
        </div>
      </Form>
    </div>
  )
}

import type { Path } from 'ui/form'
import type { ShippingBillFormValues } from '../domain/types'

export const billTabs = [
  { id: 'details', label: '1. Details' },
  { id: 'invoices', label: '2. Invoices & goods' },
  { id: 'others', label: '3. Others' }
] as const

export type BillTabId = (typeof billTabs)[number]['id']

type BillField = Path<ShippingBillFormValues>

// The list fields decide their tab; every other top-level field lives on the details tab.
const listFieldTabs: Partial<Record<string, BillTabId>> = {
  invoices: 'invoices',
  containers: 'others',
  packingRanges: 'others',
  documents: 'others',
  licenses: 'others'
}

/** The tab that shows a top-level form field. */
export function tabOfField(field: string): BillTabId {
  return listFieldTabs[field] ?? 'details'
}

/** Top-level fields shown on a tab, used to validate just that tab before moving on. */
export function fieldsOfTab(tab: BillTabId, values: ShippingBillFormValues): BillField[] {
  return (Object.keys(values) as BillField[]).filter((field) => tabOfField(field) === tab)
}

export function nextTab(tab: BillTabId): BillTabId | undefined {
  const index = billTabs.findIndex((item) => item.id === tab)
  return billTabs[index + 1]?.id
}

export function previousTab(tab: BillTabId): BillTabId | undefined {
  const index = billTabs.findIndex((item) => item.id === tab)
  return index > 0 ? billTabs[index - 1].id : undefined
}

import type { BillInvoiceForm, BillItemForm } from './types'

export function isBlank(value: string | undefined | null) {
  return value == null || value.trim() === ''
}

/** Converts an optional form string to a number. Blank or non-numeric input gives undefined. */
export function toOptionalNumber(value: string | undefined | null) {
  if (isBlank(value)) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

/** Item value: the manual override when given, otherwise quantity x unit price. */
export function itemTotal(item: BillItemForm) {
  const override = toOptionalNumber(item.lineTotal)
  if (override != null) return override
  return (toOptionalNumber(item.quantity) ?? 0) * (toOptionalNumber(item.unitPrice) ?? 0)
}

/** Sum of item values on an invoice. */
export function itemsTotal(invoice: BillInvoiceForm) {
  return invoice.items.reduce((sum, item) => sum + itemTotal(item), 0)
}

/** Invoice value: the declared total when given, otherwise the sum of its items. */
export function invoiceTotal(invoice: BillInvoiceForm) {
  return toOptionalNumber(invoice.invoiceTotal) ?? itemsTotal(invoice)
}

/**
 * Port codes are UN/LOCODEs, whose first two letters are the ISO country code
 * (INNSA1 is in India, USLAX is in the United States).
 */
export function countryFromPortCode(code: string | undefined) {
  return /^[A-Z]{2}/.exec(code ?? '')?.[0] ?? ''
}

export function formatAmount(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

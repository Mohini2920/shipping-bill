// Validation rules for the shipping bill form, kept in one place so they can be read and changed
// without touching the UI.
//
// How rules reach the inputs: fe-zen-arch's useForm(schema) turns each schema entry into
// react-hook-form register options, looked up by the LAST segment of the field path. So the rule
// for `quantity` applies to `invoices.0.items.3.quantity`. Leaf names must therefore be unique
// across the form (they are). Rules that compare two fields of the same list row need that row's
// index, which the schema never sees, so they are built per row by the functions at the bottom.
//
// Assumptions (no customs rule set was provided; these are deliberately light):
// - RITC (Indian HS) codes are 8 digits.
// - Container numbers follow ISO 6346: 4 letters + 7 digits.
// - Rates are percentages (0 to 100); amounts, weights and quantities cannot be negative.
// - Net weight cannot exceed gross weight; a packing range cannot run backwards.
// - An RBI waiver number needs a waiver date; a document cannot expire before it is issued.

import { s } from 'core/form'
import type { RegisterOptions } from 'ui/form'
import { isBlank, toOptionalNumber } from './calculations'
import type { ShippingBillFormValues } from './types'

interface NumberRule {
  min?: number
  max?: number
  /** Value must be strictly greater than min. */
  aboveMin?: boolean
  integer?: boolean
}

/** Returns an error message for a non-blank value that breaks the rule, otherwise undefined. */
function numberError(value: string | undefined, rule: NumberRule = {}) {
  if (isBlank(value)) return undefined
  const number = toOptionalNumber(value)
  if (number == null) return 'Enter a valid number'
  if (rule.integer && !Number.isInteger(number)) return 'Enter a whole number'
  if (rule.min != null && rule.aboveMin && number <= rule.min) return `Must be greater than ${rule.min}`
  if (rule.min != null && number < rule.min) return `Must be ${rule.min} or more`
  if (rule.max != null && number > rule.max) return `Must be ${rule.max} or less`
  return undefined
}

function required(message: string) {
  return s.string().requiredMsg(message)
}

function optionalNumber(rule: NumberRule = { min: 0 }) {
  return s
    .string()
    .optional()
    .refine((value) => numberError(value, rule))
}

function requiredNumber(message: string, rule: NumberRule) {
  return s
    .string()
    .requiredMsg(message)
    .refine((value) => numberError(value, rule))
}

const amount = { min: 0 }
const percentage = { min: 0, max: 100 }
const count = { min: 0, integer: true }
const serialNumber = { min: 1, integer: true }

export const billSchema = s.object({
  // Details tab
  // Parties and branches get their rules from partyRules / branchRules below.
  jobDate: required('Enter the job date'),
  loadingPort: required('Select the port of loading'),
  finalDestinationPort: required('Select the final destination port'),
  rbiWaiverDate: s
    .string()
    .optional()
    .refine((value, values: ShippingBillFormValues) =>
      !isBlank(values.rbiWaiverNumber) && isBlank(value) ? 'Enter the waiver date' : undefined
    ),
  grossWeight: optionalNumber(amount),
  netWeight: s
    .string()
    .optional()
    .refine((value, values: ShippingBillFormValues) => {
      const error = numberError(value, amount)
      if (error) return error
      const net = toOptionalNumber(value)
      const gross = toOptionalNumber(values.grossWeight)
      return net != null && gross != null && net > gross ? 'Cannot exceed the gross weight' : undefined
    }),
  totalPackages: optionalNumber(count),
  loosePackets: optionalNumber(count),
  numberOfContainers: optionalNumber(count),

  // Invoice
  invoiceNumber: required('Enter the invoice number'),
  invoiceDate: required('Enter the invoice date'),
  currency: required('Select a currency'),
  contractType: required('Select a contract type'),
  invoiceTotal: optionalNumber(amount),
  freightRate: optionalNumber(percentage),
  freightAmount: optionalNumber(amount),
  insuranceRate: optionalNumber(percentage),
  insuranceAmount: optionalNumber(amount),
  commissionRate: optionalNumber(percentage),
  commissionAmount: optionalNumber(amount),
  discountRate: optionalNumber(percentage),
  discountAmount: optionalNumber(amount),
  otherDeductionsRate: optionalNumber(percentage),
  otherDeductionsAmount: optionalNumber(amount),
  packingCharges: optionalNumber(amount),
  periodOfPayment: optionalNumber(count),

  // Item
  ritcCode: required('Enter the RITC code').matches(/^\d{8}$/, 'RITC code must be 8 digits'),
  goodsDescription1: required('Enter a goods description'),
  quantity: requiredNumber('Enter the quantity', { min: 0, aboveMin: true }),
  unitOfMeasurement: required('Select a unit'),
  unitPrice: requiredNumber('Enter the unit price', { min: 0, aboveMin: true }),
  lineTotal: optionalNumber(amount),
  numberOfUnits: optionalNumber({ min: 0, aboveMin: true }),
  presentMarketValue: optionalNumber(amount),
  cess: optionalNumber(amount),
  taxableValue: optionalNumber(amount),
  igstAmount: optionalNumber(amount),
  drawbackQuantity: optionalNumber(amount),
  totalPackage: optionalNumber(count),

  // Containers and packing
  containerNumber: required('Enter the container number').matches(
    /^[A-Za-z]{4}\d{7}$/,
    'Use 4 letters and 7 digits, e.g. MSCU1234567'
  ),
  packingNumberFrom: requiredNumber('Enter the first package number', serialNumber),
  packingNumberTo: requiredNumber('Enter the last package number', serialNumber),

  // Documents and licences
  documentTypeCode: required('Select a document type'),
  documentReferenceNumber: required('Enter the document reference number'),
  invoiceSerialNumber: optionalNumber(serialNumber),
  itemSerialNumber: optionalNumber(serialNumber),
  registrationNumber: required('Enter the registration number'),
  licenseSerialNumber: optionalNumber(serialNumber),
  licenseQuantity: optionalNumber(amount),
  licenseExportQuantity: optionalNumber(amount)
})

type SchemaField = keyof typeof billSchema.shape

/** react-hook-form rules for a field of the shipping bill form (any field path). */
export type BillRules = RegisterOptions<ShippingBillFormValues, any>

/**
 * Rules for a schema field, for components that need them passed explicitly. fe-zen-arch's Select
 * looks rules up by the full field path, which misses nested fields such as `invoices.0.currency`.
 */
export function rulesFor(field: SchemaField) {
  return billSchema.shape[field] as RegisterOptions
}

function valueAt(values: unknown, path: string) {
  return path
    .split('.')
    .reduce<unknown>(
      (current, key) => (current == null ? undefined : (current as Record<string, unknown>)[key]),
      values
    )
}

/** Exporter, consignee and buyer are required; third parties are optional. */
export function partyRules(label: string, isRequired: boolean): BillRules {
  return isRequired ? { required: `Select the ${label.toLowerCase()}` } : {}
}

/** A branch is required as soon as its party is chosen. */
export function branchRules(ownerPath: string): BillRules {
  return {
    validate: (value: string | undefined, values: ShippingBillFormValues) =>
      !isBlank(valueAt(values, ownerPath) as string) && isBlank(value) ? 'Select a branch' : undefined
  }
}

/** The last package number of a range cannot be lower than the first. */
export function packingRangeEndRules(index: number): BillRules {
  return {
    validate: (value: string, values: ShippingBillFormValues) => {
      const error = numberError(value, serialNumber)
      if (isBlank(value)) return 'Enter the last package number'
      if (error) return error
      const from = toOptionalNumber(values.packingRanges[index]?.packingNumberFrom)
      return from != null && Number(value) < from ? 'Cannot be lower than the first package number' : undefined
    }
  }
}

/** A document cannot expire before it was issued. */
export function documentExpiryRules(index: number): BillRules {
  return {
    validate: (value: string | undefined, values: ShippingBillFormValues) => {
      const issued = values.documents[index]?.documentIssueDate
      return !isBlank(value) && !isBlank(issued) && value! < issued! ? 'Cannot be before the issue date' : undefined
    }
  }
}

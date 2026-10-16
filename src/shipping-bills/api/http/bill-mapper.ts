// Converts between form values and the backend's JSON contract for POST /api/shipping-bills
// (field names taken from the original service, which followed the backend's shipping_bill.http).
//
// Open contract questions, kept here so they are easy to find and confirm with the backend team:
// - Coded fields (seal type, nature of cargo, contract type, payment type, IGST status) are sent as
//   the ICEGATE codes the form uses ('P', 'FOB', ...). The original code ran them through Number(),
//   which turned every one of them into NaN (sent as null). The backend may expect numeric ids.
// - Containers, licences, AR4 details and item third parties are not part of the original request,
//   so they are not sent. They stay in the form data only.

import { isBlank, toOptionalNumber } from '../../domain/calculations'
import { emptyBill, emptyItem } from '../../domain/defaults'
import type {
  BillInvoiceForm,
  BillItemForm,
  SavedBill,
  ShippingBillFormValues,
  ShippingBillSummary
} from '../../domain/types'

const chaId = 1000
const millisecondsPerDay = 86_400_000

/** ISO 4217 numeric currency codes used by the backend. */
const currencyCodes: Record<string, number> = { USD: 840, INR: 356, EUR: 978, AED: 784, GBP: 826, SGD: 702 }
const fileTypeCodes: Record<string, number> = { pdf: 1 }

/** The backend stores calendar dates as days since 1970-01-01. */
function toEpochDays(date: string | undefined) {
  if (isBlank(date)) return undefined
  return Math.floor(new Date(date!).getTime() / millisecondsPerDay)
}

function fromEpochDays(days: number | undefined) {
  return days == null ? '' : new Date(days * millisecondsPerDay).toISOString().slice(0, 10)
}

function currencyCode(currency: string | undefined, fallback: string) {
  return currencyCodes[isBlank(currency) ? fallback : currency!]
}

function currencyFromCode(code: number | undefined) {
  return Object.keys(currencyCodes).find((key) => currencyCodes[key] === code) ?? 'USD'
}

function text(value: number | string | undefined | null) {
  return value == null ? '' : String(value)
}

export function toBillRequest(values: ShippingBillFormValues, id?: number) {
  return {
    id,
    chaId,
    jobDate: toEpochDays(values.jobDate),
    exporterId: toOptionalNumber(values.exporterId),
    exporterBranchId: toOptionalNumber(values.exporterBranchId),
    consigneeId: toOptionalNumber(values.consigneeId),
    consigneeAddressId: toOptionalNumber(values.consigneeBranchId),
    originStateCode: toOptionalNumber(values.originStateCode),
    loadingPort: values.loadingPort,
    finalDestinationPort: values.finalDestinationPort,
    dischargePort: isBlank(values.dischargePort) ? values.finalDestinationPort : values.dischargePort,
    sealType: values.sealType,
    natureOfCargo: values.natureOfCargo,
    grossWeight: toOptionalNumber(values.grossWeight),
    netWeight: toOptionalNumber(values.netWeight),
    measurementUnit: values.measurementUnit === 'KG' ? 'KGS' : values.measurementUnit,
    totalPackages: toOptionalNumber(values.totalPackages),
    marksAndNumbers: values.marksAndNumbers,
    loosePackets: toOptionalNumber(values.loosePackets),
    numberOfContainers: values.containers.length || (toOptionalNumber(values.numberOfContainers) ?? 0),
    invoices: values.invoices.map((invoice, index) => toInvoiceRequest(values, invoice, index)),
    packgingList: values.packingRanges.map((range) => ({
      packingNumberFrom: toOptionalNumber(range.packingNumberFrom),
      packingNumberTo: toOptionalNumber(range.packingNumberTo),
      packingCode: range.packingCode
    })),
    documents: values.documents.map((document, index) => ({
      serialNumber: index + 1,
      invoiceSerialNumber: toOptionalNumber(document.invoiceSerialNumber) ?? 1,
      itemSerialNumber: toOptionalNumber(document.itemSerialNumber) ?? 1,
      imageReferenceNumber: document.imageReferenceNumber,
      documentTypeCode: document.documentTypeCode,
      documentReferenceNumber: document.documentReferenceNumber,
      documentIssueDate: toEpochDays(document.documentIssueDate),
      useDefault: true,
      fileType: fileTypeCodes[document.fileType ?? 'pdf'] ?? 1
    }))
  }
}

function toInvoiceRequest(values: ShippingBillFormValues, invoice: BillInvoiceForm, index: number) {
  const buyerSame = invoice.buyerSameAsConsignee
  return {
    serialNumber: index + 1,
    invoiceNumber: invoice.invoiceNumber,
    date: toEpochDays(invoice.invoiceDate),
    currency: currencyCodes[invoice.currency],
    contractType: invoice.contractType,
    buyerId: toOptionalNumber(buyerSame ? values.consigneeId : invoice.buyerId),
    buyerAddressId: toOptionalNumber(buyerSame ? values.consigneeBranchId : invoice.buyerBranchId),
    freightCurrency: currencyCode(invoice.freightCurrency, invoice.currency),
    freightAmount: toOptionalNumber(invoice.freightAmount) ?? 0,
    insuranceCurrency: currencyCode(invoice.insuranceCurrency, invoice.currency),
    insuranceAmount: toOptionalNumber(invoice.insuranceAmount) ?? 0,
    commissionCurrency: currencyCode(invoice.commissionCurrency, invoice.currency),
    commissionAmount: toOptionalNumber(invoice.commissionAmount) ?? 0,
    discountCurrency: currencyCode(invoice.discountCurrency, invoice.currency),
    discountAmount: toOptionalNumber(invoice.discountAmount) ?? 0,
    otherDeductionsCurrency: currencyCode(invoice.otherDeductionsCurrency, invoice.currency),
    otherDeductionsAmount: toOptionalNumber(invoice.otherDeductionsAmount) ?? 0,
    freightInsauranceIncluded: invoice.freightInsuranceIncluded,
    packingCharges: toOptionalNumber(invoice.packingCharges) ?? 0,
    natureOfPayment: invoice.natureOfPayment,
    periodOfPayment: toOptionalNumber(invoice.periodOfPayment),
    items: invoice.items.map((item, itemIndex) => toItemRequest(item, itemIndex))
  }
}

function toItemRequest(item: BillItemForm, index: number) {
  return {
    itemSerialNumber: index + 1,
    schemeCode: item.schemeCode,
    ritcCode: item.ritcCode,
    goodsDescription: item.goodsDescription1,
    unitOfMeasurement: item.unitOfMeasurement,
    quantity: toOptionalNumber(item.quantity),
    unitPrice: toOptionalNumber(item.unitPrice),
    unitOfRate: isBlank(item.unitOfRate) ? item.unitOfMeasurement : item.unitOfRate,
    noOfUnits: toOptionalNumber(item.numberOfUnits) ?? 1,
    presentMarketValue: toOptionalNumber(item.presentMarketValue),
    thirdParty: Boolean(item.thirdPartyItem),
    rewardItem: Boolean(item.rewardItem),
    totalPackage: toOptionalNumber(item.totalPackage),
    endUseOfItem: item.endUseOfItem,
    igstPaymentStatus: item.igstPaymentStatus,
    originDistrictCode: toOptionalNumber(item.originDistrictCode),
    tradeAgreementsCode: item.tradeAgreementsCode,
    drawbackSerialNumber: item.drawbackSerialNumber,
    drawbackQuantity: toOptionalNumber(item.drawbackQuantity)
  }
}

export type BillRequest = ReturnType<typeof toBillRequest>

/** Assumption: GET and POST respond with the request shape plus the record id and timestamps. */
export type BillResponse = BillRequest & { id: number; jobNumber?: number; createdAt?: number; updatedAt?: number }

/** Shape of one row from GET /api/shipping-bills (as seen in the original seed data). */
export interface BillListRow {
  id: number
  jobNumber?: number
  jobDate?: number
  exporterName?: string
  consigneeName?: string
  loadingPort?: string
  destinationPort?: string
  /** Unix time in seconds. */
  updated?: number
}

function fromUnixSeconds(seconds: number | undefined) {
  return seconds == null ? new Date(0).toISOString() : new Date(seconds * 1000).toISOString()
}

export function fromBillListRow(row: BillListRow): ShippingBillSummary {
  return {
    id: row.id,
    jobNumber: row.jobNumber == null ? undefined : String(row.jobNumber),
    jobDate: fromEpochDays(row.jobDate),
    exporterName: row.exporterName,
    consigneeName: row.consigneeName,
    loadingPort: row.loadingPort ?? '',
    finalDestinationPort: row.destinationPort ?? '',
    invoiceNumbers: [],
    updated: fromUnixSeconds(row.updated)
  }
}

export function fromBillResponse(raw: BillResponse): SavedBill {
  const values: ShippingBillFormValues = {
    ...emptyBill(),
    jobNumber: raw.jobNumber == null ? undefined : String(raw.jobNumber),
    jobDate: fromEpochDays(raw.jobDate),
    exporterId: text(raw.exporterId),
    exporterBranchId: text(raw.exporterBranchId),
    consigneeId: text(raw.consigneeId),
    consigneeBranchId: text(raw.consigneeAddressId),
    originStateCode: text(raw.originStateCode),
    loadingPort: raw.loadingPort,
    finalDestinationPort: raw.finalDestinationPort,
    dischargePort: raw.dischargePort,
    sealType: raw.sealType,
    natureOfCargo: raw.natureOfCargo,
    grossWeight: text(raw.grossWeight),
    netWeight: text(raw.netWeight),
    measurementUnit: raw.measurementUnit === 'KGS' ? 'KG' : raw.measurementUnit,
    totalPackages: text(raw.totalPackages),
    marksAndNumbers: raw.marksAndNumbers,
    loosePackets: text(raw.loosePackets),
    numberOfContainers: text(raw.numberOfContainers),
    invoices: raw.invoices.map((invoice) => ({
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: fromEpochDays(invoice.date),
      currency: currencyFromCode(invoice.currency),
      contractType: invoice.contractType,
      buyerSameAsConsignee: invoice.buyerId === raw.consigneeId,
      buyerId: text(invoice.buyerId),
      buyerBranchId: text(invoice.buyerAddressId),
      freightAmount: text(invoice.freightAmount || undefined),
      insuranceAmount: text(invoice.insuranceAmount || undefined),
      commissionAmount: text(invoice.commissionAmount || undefined),
      discountAmount: text(invoice.discountAmount || undefined),
      otherDeductionsAmount: text(invoice.otherDeductionsAmount || undefined),
      packingCharges: text(invoice.packingCharges || undefined),
      freightInsuranceIncluded: invoice.freightInsauranceIncluded,
      natureOfPayment: invoice.natureOfPayment,
      periodOfPayment: text(invoice.periodOfPayment),
      items: invoice.items.map((item) => ({
        ...emptyItem(),
        schemeCode: item.schemeCode,
        ritcCode: item.ritcCode,
        goodsDescription1: item.goodsDescription,
        unitOfMeasurement: item.unitOfMeasurement,
        quantity: text(item.quantity),
        unitPrice: text(item.unitPrice),
        unitOfRate: item.unitOfRate,
        numberOfUnits: text(item.noOfUnits),
        presentMarketValue: text(item.presentMarketValue),
        thirdPartyItem: item.thirdParty,
        rewardItem: item.rewardItem,
        totalPackage: text(item.totalPackage),
        endUseOfItem: item.endUseOfItem,
        igstPaymentStatus: item.igstPaymentStatus,
        originDistrictCode: text(item.originDistrictCode),
        tradeAgreementsCode: item.tradeAgreementsCode,
        drawbackSerialNumber: item.drawbackSerialNumber,
        drawbackQuantity: text(item.drawbackQuantity)
      }))
    })),
    packingRanges: raw.packgingList.map((range) => ({
      packingNumberFrom: text(range.packingNumberFrom),
      packingNumberTo: text(range.packingNumberTo),
      packingCode: range.packingCode
    })),
    documents: raw.documents.map((document) => ({
      documentTypeCode: document.documentTypeCode,
      documentReferenceNumber: document.documentReferenceNumber,
      imageReferenceNumber: document.imageReferenceNumber,
      documentIssueDate: fromEpochDays(document.documentIssueDate),
      invoiceSerialNumber: text(document.invoiceSerialNumber),
      itemSerialNumber: text(document.itemSerialNumber),
      fileType: 'pdf'
    }))
  }

  return {
    id: raw.id,
    created: fromUnixSeconds(raw.createdAt),
    updated: fromUnixSeconds(raw.updatedAt),
    values
  }
}

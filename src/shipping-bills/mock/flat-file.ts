// Builds the ICEGATE-style .sb flat file for a bill. In production the backend generates this
// (GET /api/shipping-bills/:id/flat-file); the mock bill service uses this function to stand in.
// The layout is unchanged from the original client-side fallback generator.

import { isBlank, itemTotal } from '../domain/calculations'
import type { FlatFile, SavedBill } from '../domain/types'

const defaultChaId = '1000'

/** Field separator and line breaks are part of the format, so they are stripped from free text. */
function clean(value: string | undefined) {
  return (value ?? '').replace(/[\^\r\n]+/g, ' ')
}

/** Uses the fallback when the value is missing or an empty form string. */
function orDefault(value: string | undefined, fallback: string) {
  return isBlank(value) ? fallback : value!
}

export function buildFlatFile(bill: SavedBill): FlatFile {
  const values = bill.values
  const jobNumber = values.jobNumber ?? String(bill.id)
  const header = `ZZ*${orDefault(values.loadingPort, 'INMUN1')}*ZZ*ICEGATE*01*SB*1.0*`
  const lines: string[] = [`HREC**${header}`]

  lines.push('<TABLE>SHIPPING_BILL')
  lines.push(
    '<F>MESSAGE_TYPE^CHA_ID^JOB_NO^JOB_DATE^EXPORTER_ID^EXPORTER_BRANCH^CONSIGNEE_ID^LOADING_PORT^DEST_PORT^DISCHARGE_PORT^SEAL_TYPE^NATURE_OF_CARGO^GROSS_WEIGHT^NET_WEIGHT^UOM^PACKAGES^MARKS'
  )
  lines.push(
    [
      '<R>F',
      defaultChaId,
      jobNumber,
      values.jobDate,
      values.exporterId,
      values.exporterBranchId,
      values.consigneeId,
      values.loadingPort,
      values.finalDestinationPort,
      orDefault(values.dischargePort, values.finalDestinationPort),
      values.sealType ?? '',
      values.natureOfCargo,
      values.grossWeight ?? '',
      values.netWeight ?? '',
      values.measurementUnit,
      values.totalPackages ?? '',
      clean(values.marksAndNumbers)
    ].join('^')
  )

  if (values.invoices.length > 0) {
    lines.push('<TABLE>INVOICE')
    lines.push('<F>INVOICE_SN^INVOICE_NO^INVOICE_DATE^CURRENCY^CONTRACT_TYPE^BUYER_ID^FREIGHT_AMOUNT^INSURANCE_AMOUNT')
    values.invoices.forEach((invoice, index) => {
      const buyerId = invoice.buyerSameAsConsignee ? values.consigneeId : invoice.buyerId
      lines.push(
        [
          `<R>${index + 1}`,
          invoice.invoiceNumber,
          invoice.invoiceDate,
          invoice.currency,
          invoice.contractType,
          buyerId,
          orDefault(invoice.freightAmount, '0'),
          orDefault(invoice.insuranceAmount, '0')
        ].join('^')
      )
    })

    lines.push('<TABLE>ITEM')
    lines.push('<F>INVOICE_SN^ITEM_SN^RITC_CODE^DESCRIPTION^QUANTITY^UOM^UNIT_PRICE^LINE_TOTAL^SCHEME_CODE')
    values.invoices.forEach((invoice, invoiceIndex) => {
      invoice.items.forEach((item, itemIndex) => {
        lines.push(
          [
            `<R>${invoiceIndex + 1}`,
            itemIndex + 1,
            item.ritcCode,
            clean(item.goodsDescription1),
            item.quantity,
            item.unitOfMeasurement,
            item.unitPrice,
            itemTotal(item).toFixed(2),
            item.schemeCode ?? ''
          ].join('^')
        )
      })
    })
  }

  if (values.packingRanges.length > 0) {
    lines.push('<TABLE>PACKING')
    lines.push('<F>FROM_PKG^TO_PKG^PKG_CODE')
    values.packingRanges.forEach((range) => {
      lines.push(`<R>${range.packingNumberFrom}^${range.packingNumberTo}^${orDefault(range.packingCode, 'CTN')}`)
    })
  }

  lines.push(`TREC**${header}`)

  return { filename: `shipping_bill_${jobNumber}.sb`, content: lines.join('\r\n') }
}

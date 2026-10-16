import { InternalError } from 'core/utils'
import type { ShippingBillService } from '../api/types'
import { invoiceTotal } from '../domain/calculations'
import type { SavedBill, ShippingBillSummary } from '../domain/types'
import { buildFlatFile } from './flat-file'
import { mockDb } from './mock-db'
import { mockRequest, mockSearch } from './mock-network'

function findBill(id: number) {
  const bill = mockDb.read().bills.find((record) => record.id === id)
  if (!bill) throw new InternalError('Shipping bill not found', 404, `No shipping bill exists with id ${id}.`)
  return bill
}

function toSummary(bill: SavedBill): ShippingBillSummary {
  const { exporters, businesses } = mockDb.read()
  const { values } = bill
  return {
    id: bill.id,
    jobNumber: values.jobNumber,
    jobDate: values.jobDate,
    exporterName: exporters.find((party) => String(party.id) === values.exporterId)?.name,
    consigneeName: businesses.find((party) => String(party.id) === values.consigneeId)?.name,
    loadingPort: values.loadingPort,
    finalDestinationPort: values.finalDestinationPort,
    invoiceNumbers: values.invoices.map((invoice) => invoice.invoiceNumber).filter(Boolean),
    totalValue: values.invoices.reduce((sum, invoice) => sum + invoiceTotal(invoice), 0),
    updated: bill.updated
  }
}

export const mockBillService: ShippingBillService = {
  list() {
    return mockSearch(() => [...mockDb.read().bills].sort((a, b) => b.updated.localeCompare(a.updated)).map(toSummary))
  },

  get(id) {
    return mockRequest('read', () => findBill(id))
  },

  save(values, id) {
    return mockRequest('write', () => {
      const now = new Date().toISOString()
      const previous = id == null ? undefined : findBill(id)
      const saved: SavedBill = {
        id: previous?.id ?? mockDb.nextId(),
        created: previous?.created ?? now,
        updated: now,
        // The job number is assigned by the backend on first save and never changes afterwards.
        values: { ...values, jobNumber: previous?.values.jobNumber ?? mockDb.nextJobNumber() }
      }
      mockDb.update((db) => {
        db.bills = [saved, ...db.bills.filter((bill) => bill.id !== saved.id)]
      })
      return saved
    })
  },

  getFlatFile(id) {
    return mockRequest('read', () => buildFlatFile(findBill(id)))
  }
}

// Real-backend implementation of ShippingBillService, built on core/request so it shares the app's
// timeout, error type (InternalError) and interceptors with any other HTTP call.
//
// NOT exercised against a live server: there is no backend in this assignment. It is selected only
// when PUBLIC_BILL_API=http (see api/index.ts) and exists to show that swapping the mock for real
// HTTP needs no UI changes. Endpoints marked "assumed" are not in the original shipping_bill.http.

import { get, post } from 'core/request'
import { InternalError } from 'core/utils'
import type { ShippingBillService } from '../types'
import { BillListRow, BillResponse, fromBillListRow, fromBillResponse, toBillRequest } from './bill-mapper'

const baseUrl = `${import.meta.env.PUBLIC_API_URL}/api/shipping-bills`

// Development tenant header carried over from the original service. Real authentication belongs in
// the request interceptor (src/shared/interceptors.ts) once the backend's auth scheme is known.
const headers = { Authorization: 'tenantId=1000&user=1000&role=1' }

export const httpBillService: ShippingBillService = {
  async list() {
    const rows = await get<BillListRow[]>(baseUrl, { headers })
    return rows.map(fromBillListRow)
  },

  async get(id) {
    // Assumed endpoint (REST convention).
    return fromBillResponse(await get<BillResponse>(`${baseUrl}/${id}`, { headers }))
  },

  async save(values, id) {
    // Documented upsert endpoint. Assumed: it updates when the body carries an id.
    return fromBillResponse(await post<BillResponse>(baseUrl, toBillRequest(values, id), { headers }))
  },

  async getFlatFile(id) {
    // core/request always parses JSON, but this endpoint returns plain text, so fetch is used directly.
    const response = await fetch(`${baseUrl}/${id}/flat-file`, { headers: { ...headers, Accept: '*/*' } })
    if (!response.ok) throw new InternalError('Could not download the flat file', response.status)
    const disposition = response.headers.get('content-disposition') ?? ''
    const filename = /filename="?([^";]+)"?/.exec(disposition)?.[1] ?? `shipping_bill_${id}.sb`
    return { filename, content: await response.text() }
  }
}

// The single place that decides which service implementations the app uses.
// Components import services from here, never from mock/ or http/ directly, so replacing a mock
// with a real API is a change to this file only.

import { mockBillService } from '../mock/mock-bill-service'
import { mockPartyService } from '../mock/mock-party-service'
import { mockReferenceDataService } from '../mock/mock-reference-service'
import { httpBillService } from './http/http-bill-service'
import type { PartyService, ReferenceDataService, ShippingBillService } from './types'

/** Set PUBLIC_BILL_API=http in .env to send bills to the real backend at PUBLIC_API_URL. */
export const usesMockBillApi = import.meta.env.PUBLIC_BILL_API !== 'http'

export const billService: ShippingBillService = usesMockBillApi ? mockBillService : httpBillService

// No backend endpoints exist yet for parties and reference data, so these are always mocked.
export const partyService: PartyService = mockPartyService
export const referenceDataService: ReferenceDataService = mockReferenceDataService

export type { PartyService, ReferenceDataService, ShippingBillService } from './types'

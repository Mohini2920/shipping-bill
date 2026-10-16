// Service contracts. UI code depends only on these interfaces; api/index.ts decides which
// implementation (mock or HTTP) is used. Every method is async because a real backend would be.
//
// Errors: implementations reject with core's InternalError (message + HTTP-like status), the same
// error type core/request throws, so the UI handles mock and real failures identically.

import type {
  Branch,
  BranchInput,
  Business,
  BusinessRole,
  Exporter,
  FlatFile,
  FormOptions,
  Option,
  Party,
  PartyInput,
  PartyKind,
  Port,
  SavedBill,
  ShippingBillFormValues,
  ShippingBillSummary
} from '../domain/types'

export interface ShippingBillService {
  list(): Promise<ShippingBillSummary[]>
  /** Rejects with status 404 when the bill does not exist. */
  get(id: number): Promise<SavedBill>
  /** Creates a bill when id is undefined, otherwise updates it. Resolves with the stored bill. */
  save(values: ShippingBillFormValues, id?: number): Promise<SavedBill>
  getFlatFile(id: number): Promise<FlatFile>
}

export interface PartyService {
  searchExporters(query: string): Promise<Exporter[]>
  searchBusinesses(role: BusinessRole, query: string): Promise<Business[]>
  getParty(kind: PartyKind, id: number): Promise<Party | undefined>
  searchBranches(kind: PartyKind, ownerId: number, query: string): Promise<Branch[]>
  createParty(kind: PartyKind, input: PartyInput): Promise<Party>
  createBranch(kind: PartyKind, ownerId: number, input: BranchInput): Promise<Branch>
}

export interface ReferenceDataService {
  getFormOptions(): Promise<FormOptions>
  searchLoadingPorts(query: string): Promise<Port[]>
  searchDestinationPorts(query: string): Promise<Port[]>
  getPort(code: string): Promise<Port | undefined>
  searchDocumentTypes(query: string): Promise<Option[]>
  getMarksAndNumbers(exporterId: number): Promise<Option[]>
}

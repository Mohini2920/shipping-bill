// react-query cache keys in one place, so reads and invalidations always agree.

import type { BusinessRole, PartyKind } from '../domain/types'

export const queryKeys = {
  bills: ['bills'] as const,
  bill: (id: number) => ['bills', id] as const,
  formOptions: ['form-options'] as const,
  parties: ['parties'] as const,
  partySearch: (kind: PartyKind, role: BusinessRole | undefined, query: string) =>
    ['parties', kind, role, 'search', query] as const,
  party: (kind: PartyKind, id: number) => ['parties', kind, id] as const,
  branchSearch: (kind: PartyKind, ownerId: number, query: string) =>
    ['parties', kind, ownerId, 'branches', query] as const,
  loadingPorts: (query: string) => ['ports', 'loading', query] as const,
  destinationPorts: (query: string) => ['ports', 'destination', query] as const,
  port: (code: string) => ['ports', code] as const,
  documentTypes: (query: string) => ['document-types', query] as const,
  marksAndNumbers: (exporterId: number) => ['marks-and-numbers', exporterId] as const
}

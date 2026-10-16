import { InternalError } from 'core/utils'
import type { PartyService } from '../api/types'
import type { Branch, Business, BusinessRole, Exporter, Party, PartyKind } from '../domain/types'
import { mockDb } from './mock-db'
import { matchesQuery, mockRequest, mockSearch } from './mock-network'

const roleFlag: Record<BusinessRole, 'isConsignee' | 'isBuyer' | 'isThirdParty'> = {
  consignee: 'isConsignee',
  buyer: 'isBuyer',
  thirdParty: 'isThirdParty'
}

function partiesOf(kind: PartyKind): Party[] {
  const { exporters, businesses } = mockDb.read()
  return kind === 'exporter' ? exporters : businesses
}

export const mockPartyService: PartyService = {
  searchExporters(query) {
    return mockSearch(() =>
      mockDb.read().exporters.filter((party) => !party.disabled && matchesQuery(query, party.name, party.iec))
    )
  },

  searchBusinesses(role, query) {
    return mockSearch(() =>
      mockDb.read().businesses.filter((party) => party[roleFlag[role]] && matchesQuery(query, party.name, party.iec))
    )
  },

  getParty(kind, id) {
    return mockRequest('read', () => partiesOf(kind).find((party) => party.id === id))
  },

  searchBranches(kind, ownerId, query) {
    return mockSearch(() => {
      const owner = partiesOf(kind).find((party) => party.id === ownerId)
      return (owner?.branches ?? []).filter((branch) => matchesQuery(query, branch.branchName, branch.city))
    })
  },

  createParty(kind, input) {
    return mockRequest('write', () => {
      const name = input.name.trim()
      const duplicate = partiesOf(kind).some((party) => party.name.toLowerCase() === name.toLowerCase())
      if (duplicate) throw new InternalError('Party already exists', 409, `"${name}" is already registered.`)

      const id = mockDb.nextId()
      const branches: Branch[] = [{ ...input.firstBranch, id: id + 1 }]
      if (kind === 'exporter') {
        const exporter: Exporter = {
          id,
          name,
          iec: input.iec ?? '',
          class: input.class ?? 'F',
          type: input.type ?? 'P',
          pan: input.pan,
          tan: input.tan,
          aeoNumber: input.aeoNumber,
          website: input.website,
          notes: input.notes,
          branches
        }
        mockDb.update((db) => db.exporters.push(exporter))
        return exporter
      }

      const business: Business = {
        id,
        name,
        iec: input.iec,
        isConsignee: input.isConsignee ?? false,
        isBuyer: input.isBuyer ?? false,
        isNotify: input.isNotify ?? false,
        isThirdParty: input.isThirdParty ?? false,
        branches
      }
      mockDb.update((db) => db.businesses.push(business))
      return business
    })
  },

  createBranch(kind, ownerId, input) {
    return mockRequest('write', () => {
      if (!partiesOf(kind).some((party) => party.id === ownerId)) {
        throw new InternalError('Party not found', 404, `No ${kind} exists with id ${ownerId}.`)
      }
      const branch: Branch = { ...input, id: mockDb.nextId() }
      mockDb.update((db) => {
        const owners: Party[] = kind === 'exporter' ? db.exporters : db.businesses
        owners.find((party) => party.id === ownerId)?.branches.push(branch)
      })
      return branch
    })
  }
}

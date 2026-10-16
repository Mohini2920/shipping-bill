// In-memory "database" for the mock services, persisted to localStorage so data survives reloads.
// Mock services are the only code that touches it.

import type { Business, Exporter, SavedBill } from '../domain/types'
import { seedBills } from './seed-bills'
import { seedBusinesses, seedExporters } from './seed-parties'

export interface MockDbState {
  exporters: Exporter[]
  businesses: Business[]
  bills: SavedBill[]
}

const storageKey = 'shipping-bill-mock-db-v1'

function seedState(): MockDbState {
  return structuredClone({ exporters: seedExporters, businesses: seedBusinesses, bills: seedBills })
}

function loadState(): MockDbState {
  try {
    const raw = localStorage.getItem(storageKey)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<MockDbState>
      if (Array.isArray(parsed.exporters) && Array.isArray(parsed.businesses) && Array.isArray(parsed.bills)) {
        return parsed as MockDbState
      }
    }
  } catch {
    // Unreadable or unavailable storage: start from the seed data.
  }
  return seedState()
}

let state = loadState()

function persist() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state))
  } catch {
    // Storage disabled or full: the mock keeps working in memory for this session.
  }
}

export const mockDb = {
  read(): Readonly<MockDbState> {
    return state
  },

  /** Applies a change to a copy of the state, then swaps it in and persists it. */
  update(change: (draft: MockDbState) => void) {
    const draft = structuredClone(state)
    change(draft)
    state = draft
    persist()
  },

  /** Next free id. One counter for every record type keeps ids unique and easy to debug. */
  nextId() {
    const ids = [
      ...state.exporters.flatMap((party) => [party.id, ...party.branches.map((branch) => branch.id)]),
      ...state.businesses.flatMap((party) => [party.id, ...party.branches.map((branch) => branch.id)]),
      ...state.bills.map((bill) => bill.id)
    ]
    return Math.max(3000, ...ids) + 1
  },

  nextJobNumber() {
    const numbers = state.bills.map((bill) => Number(bill.values.jobNumber)).filter(Number.isFinite)
    return String(Math.max(2080, ...numbers) + 1)
  }
}

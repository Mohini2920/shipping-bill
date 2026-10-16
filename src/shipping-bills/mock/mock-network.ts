// Simulates network behaviour for the mock services: latency, failures and empty results.
//
// The active scenario is read from localStorage on every request, so it can be switched at runtime
// (the app header shows a picker while the mock API is in use). This makes loading, error and empty
// states testable without a backend.

import { InternalError, wait } from 'core/utils'

export const mockScenarios = [
  { value: 'normal', label: 'Normal' },
  { value: 'slow', label: 'Slow network' },
  { value: 'empty', label: 'Empty results' },
  { value: 'fail-load', label: 'Loading fails' },
  { value: 'fail-save', label: 'Saving fails' }
] as const

export type MockScenario = (typeof mockScenarios)[number]['value']

const scenarioStorageKey = 'shipping-bill-mock-scenario'
const normalLatencyMs = 300
const slowLatencyMs = 2500

export function getMockScenario(): MockScenario {
  try {
    const stored = localStorage.getItem(scenarioStorageKey)
    const known = mockScenarios.find((scenario) => scenario.value === stored)
    return known?.value ?? 'normal'
  } catch {
    // Storage can be unavailable (private mode, blocked cookies). Fall back to normal behaviour.
    return 'normal'
  }
}

export function setMockScenario(scenario: MockScenario) {
  try {
    localStorage.setItem(scenarioStorageKey, scenario)
  } catch {
    // Without storage the scenario cannot be changed; requests keep using 'normal'.
  }
}

/**
 * read:   fetch one record or a fixed option list
 * search: return a list that may legitimately be empty (list pages, search boxes, dependent options)
 * write:  create or update data
 */
type RequestKind = 'read' | 'search' | 'write'

async function simulate(kind: RequestKind) {
  const scenario = getMockScenario()
  await wait(scenario === 'slow' ? slowLatencyMs : normalLatencyMs)

  if (scenario === 'fail-load' && kind !== 'write') {
    throw new InternalError('Could not load data', 503, 'The mock scenario "Loading fails" is active.')
  }
  if (scenario === 'fail-save' && kind === 'write') {
    throw new InternalError('Could not save', 503, 'The mock scenario "Saving fails" is active.')
  }
  return scenario
}

/**
 * Runs a mock handler as if it were a request. The result is deep-cloned, like data that crossed
 * the network, so callers can never mutate the mock database by accident.
 * Handlers signal request errors (404, 409 ...) by throwing InternalError.
 */
export async function mockRequest<T>(kind: 'read' | 'write', handler: () => T): Promise<T> {
  await simulate(kind)
  return structuredClone(handler())
}

/** Like mockRequest, but honours the "Empty results" scenario. */
export async function mockSearch<T>(handler: () => T[]): Promise<T[]> {
  const scenario = await simulate('search')
  if (scenario === 'empty') return []
  return structuredClone(handler())
}

export function matchesQuery(query: string, ...fields: (string | undefined)[]) {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return fields.some((field) => field?.toLowerCase().includes(needle))
}

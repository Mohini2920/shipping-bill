import { queryClient } from 'core/react-query'
import { useState } from 'react'
import { getMockScenario, MockScenario, mockScenarios, setMockScenario, usesMockBillApi } from '../api'

/**
 * Lets a reviewer switch the mock backend between normal, slow, empty and failing behaviour to see
 * every loading, empty and error state. Hidden when the real bill API is configured.
 */
export function MockScenarioPicker() {
  const [scenario, setScenario] = useState(getMockScenario)
  if (!usesMockBillApi) return null

  function change(next: MockScenario) {
    setMockScenario(next)
    setScenario(next)
    // Refetch what is on screen so the new scenario shows immediately. Data already loaded stays visible.
    void queryClient.invalidateQueries()
  }

  return (
    <label className="flex items-center gap-2 text-xs text-gray-500">
      Mock API
      <select
        value={scenario}
        onChange={(event) => change(event.target.value as MockScenario)}
        className="rounded border bg-inherit px-2 py-1 text-xs">
        {mockScenarios.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

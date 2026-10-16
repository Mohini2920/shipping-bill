import type { ReferenceDataService } from '../api/types'
import { matchesQuery, mockRequest, mockSearch } from './mock-network'
import { destinationPorts, documentTypes, formOptions, loadingPorts, marksByExporter } from './seed-reference-data'

export const mockReferenceDataService: ReferenceDataService = {
  getFormOptions() {
    return mockRequest('read', () => formOptions)
  },

  searchLoadingPorts(query) {
    return mockSearch(() => loadingPorts.filter((port) => matchesQuery(query, port.name, port.code)))
  },

  searchDestinationPorts(query) {
    return mockSearch(() => destinationPorts.filter((port) => matchesQuery(query, port.name, port.code)))
  },

  getPort(code) {
    // Looks in both lists; the original lookup only checked destination ports, so a saved
    // loading port was shown as a bare code when a bill was reopened.
    return mockRequest('read', () => [...loadingPorts, ...destinationPorts].find((port) => port.code === code))
  },

  searchDocumentTypes(query) {
    return mockSearch(() => documentTypes.filter((type) => matchesQuery(query, type.label, type.value)))
  },

  getMarksAndNumbers(exporterId) {
    return mockSearch(() => (marksByExporter[exporterId] ?? []).map((mark) => ({ value: mark, label: mark })))
  }
}

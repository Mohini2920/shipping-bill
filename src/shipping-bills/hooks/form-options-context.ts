import { createContext, useContext } from 'react'
import type { FormOptions } from '../domain/types'

/**
 * Dropdown options for the bill editor. The page loads them once through the reference data
 * service and provides them here, so nested components read them without prop drilling.
 */
export const FormOptionsContext = createContext<FormOptions | null>(null)

export function useFormOptions(): FormOptions {
  const options = useContext(FormOptionsContext)
  if (options == null) throw new Error('useFormOptions must be used inside FormOptionsContext.Provider')
  return options
}

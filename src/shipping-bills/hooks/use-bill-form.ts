import { getFormContext } from 'core/form'
import type { ShippingBillFormValues } from '../domain/types'

/** react-hook-form methods of the shipping bill form, typed. Must be used inside its <Form>. */
export function useBillForm() {
  return getFormContext<ShippingBillFormValues>().hooks
}

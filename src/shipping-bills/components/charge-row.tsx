import { useWatch } from 'ui/form'
import { Input } from 'ui/inputs/input'
import { Select } from 'ui/inputs/select'
import { isBlank } from '../domain/calculations'
import type { ChargeDefinition } from '../domain/charges'
import type { ShippingBillFormValues } from '../domain/types'
import { useFormOptions } from '../hooks/form-options-context'
import { useBillForm } from '../hooks/use-bill-form'
import { numberInputType } from './input-types'

interface ChargeRowProps {
  invoiceIndex: number
  charge: ChargeDefinition
  invoiceCurrency: string
}

/** One invoice charge, entered as a rate or an amount: filling one disables the other. */
export function ChargeRow({ invoiceIndex, charge, invoiceCurrency }: ChargeRowProps) {
  const { register, control } = useBillForm()
  const { currencies } = useFormOptions()
  const prefix = `invoices.${invoiceIndex}` as const
  const [rate, amount] = useWatch({
    control,
    name: [`${prefix}.${charge.rateField}`, `${prefix}.${charge.amountField}`]
  })

  return (
    <div className="flex flex-wrap items-center gap-2 p-2 lg:flex-nowrap">
      <span className="w-32 shrink-0 text-sm font-medium">{charge.label}</span>
      <div className="flex items-center gap-1">
        <Input
          type={numberInputType}
          placeholder="Rate"
          className="text-right"
          disabled={!isBlank(amount)}
          {...register(`${prefix}.${charge.rateField}`)}
        />
        <span className="text-xs text-gray-500">%</span>
      </div>
      <Input
        type={numberInputType}
        placeholder="Amount"
        className="text-right"
        disabled={!isBlank(rate)}
        {...register(`${prefix}.${charge.amountField}`)}
      />
      <div className="w-24 shrink-0">
        <Select<ShippingBillFormValues>
          name={`${prefix}.${charge.currencyField}`}
          options={currencies}
          placeholder={invoiceCurrency}
        />
      </div>
    </div>
  )
}

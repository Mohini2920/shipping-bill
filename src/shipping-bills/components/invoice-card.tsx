import { Button } from 'ui/basic/button'
import { Card, CardContent, CardHeader } from 'ui/basic/card'
import { useFieldArray, useWatch } from 'ui/form'
import { Checkbox } from 'ui/inputs/checkbox'
import { Input } from 'ui/inputs/input'
import { Select } from 'ui/inputs/select'
import { formatAmount, itemsTotal } from '../domain/calculations'
import { invoiceCharges } from '../domain/charges'
import { emptyItem } from '../domain/defaults'
import type { BillInvoiceForm, ShippingBillFormValues } from '../domain/types'
import { rulesFor } from '../domain/validation'
import { useFormOptions } from '../hooks/form-options-context'
import { useBillForm } from '../hooks/use-bill-form'
import { ChargeRow } from './charge-row'
import { SectionHeading } from './form-layout'
import { dateInputType, numberInputType } from './input-types'
import { ItemFields } from './item-fields'
import { PartyBranchFields } from './party-branch-fields'

interface InvoiceCardProps {
  index: number
  onRemove?: () => void
}

export function InvoiceCard({ index, onRemove }: InvoiceCardProps) {
  const { register, control } = useBillForm()
  const options = useFormOptions()
  const path = `invoices.${index}` as const
  const invoice = useWatch({ control, name: path }) as BillInvoiceForm | undefined
  const items = useFieldArray({ control, name: `${path}.items` })
  const currency = invoice?.currency ?? ''

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <h3 className="font-semibold">Invoice {index + 1}</h3>
        {onRemove != null && (
          <Button size="sm" variant="ghost" onClick={onRemove}>
            Remove invoice
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Input label="Invoice number" {...register(`${path}.invoiceNumber`)} />
          <Input label="Invoice date" type={dateInputType} {...register(`${path}.invoiceDate`)} />
          <Select<ShippingBillFormValues>
            label="Currency"
            name={`${path}.currency`}
            options={options.currencies}
            rules={rulesFor('currency')}
          />
          <Input
            label="Declared total"
            type={numberInputType}
            placeholder={invoice ? formatAmount(itemsTotal(invoice)) : '0.00'}
            {...register(`${path}.invoiceTotal`)}
          />
          <Select<ShippingBillFormValues>
            label="Contract"
            name={`${path}.contractType`}
            options={options.contractTypes}
            rules={rulesFor('contractType')}
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <Checkbox {...register(`${path}.buyerSameAsConsignee`)} />
          Buyer and consignee are the same
        </label>
        {invoice?.buyerSameAsConsignee === false && (
          <PartyBranchFields
            kind="business"
            role="buyer"
            label="Buyer"
            ownerField={`${path}.buyerId`}
            branchField={`${path}.buyerBranchId`}
          />
        )}

        <div className="divide-y rounded-lg border">
          {invoiceCharges.map((charge) => (
            <ChargeRow key={charge.label} invoiceIndex={index} charge={charge} invoiceCurrency={currency} />
          ))}
          <div className="flex flex-wrap items-center gap-2 p-2 lg:flex-nowrap">
            <span className="w-32 shrink-0 text-sm font-medium">Packing charges</span>
            <Input
              type={numberInputType}
              placeholder="Amount"
              className="text-right"
              {...register(`${path}.packingCharges`)}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select<ShippingBillFormValues>
            label="Price includes"
            name={`${path}.freightInsuranceIncluded`}
            options={options.priceInclusionTypes}
            placeholder="Select if applicable"
          />
          <Input label="Contract / order number" {...register(`${path}.contractNumber`)} />
          <Select<ShippingBillFormValues>
            label="Payment type"
            name={`${path}.natureOfPayment`}
            options={options.paymentTypes}
            placeholder="Select if applicable"
          />
          <Input label="Payment period (days)" type={numberInputType} {...register(`${path}.periodOfPayment`)} />
        </div>

        <PartyBranchFields
          kind="business"
          role="thirdParty"
          label="Third party (optional)"
          ownerField={`${path}.thirdPartyId`}
          branchField={`${path}.thirdPartyBranchId`}
          required={false}
        />

        <div className="space-y-4 border-t pt-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SectionHeading title="Goods" />
            <Button size="sm" variant="outline" onClick={() => items.append(emptyItem())}>
              + Add item
            </Button>
          </div>
          {items.fields.map((field, itemIndex) => (
            <ItemFields
              key={field.id}
              invoiceIndex={index}
              itemIndex={itemIndex}
              currency={currency}
              onRemove={items.fields.length > 1 ? () => items.remove(itemIndex) : undefined}
            />
          ))}
        </div>

        <p className="text-right text-sm font-semibold">
          Items total: {currency} {invoice ? formatAmount(itemsTotal(invoice)) : '0'}
        </p>
      </CardContent>
    </Card>
  )
}

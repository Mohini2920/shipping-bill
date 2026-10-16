import { useWatch } from 'ui/form'
import { Checkbox } from 'ui/inputs/checkbox'
import { Input } from 'ui/inputs/input'
import { Select } from 'ui/inputs/select'
import { formatAmount, itemTotal } from '../domain/calculations'
import type { BillItemForm, ShippingBillFormValues } from '../domain/types'
import { rulesFor } from '../domain/validation'
import { useFormOptions } from '../hooks/form-options-context'
import { useBillForm } from '../hooks/use-bill-form'
import { Collapsible, ListItemCard } from './form-layout'
import { dateInputType, numberInputType } from './input-types'
import { PartyBranchFields } from './party-branch-fields'

interface ItemFieldsProps {
  invoiceIndex: number
  itemIndex: number
  currency: string
  onRemove?: () => void
}

/** One goods line of an invoice. */
export function ItemFields({ invoiceIndex, itemIndex, currency, onRemove }: ItemFieldsProps) {
  const { register, control } = useBillForm()
  const options = useFormOptions()
  const path = `invoices.${invoiceIndex}.items.${itemIndex}` as const
  const item = useWatch({ control, name: path }) as BillItemForm | undefined

  const scheme = options.schemes.find((option) => option.value === item?.schemeCode)
  const total = item ? itemTotal(item) : 0

  return (
    <ListItemCard title={`Item ${itemIndex + 1}`} onRemove={onRemove}>
      <div className="mb-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <Input label="RITC / HS code" placeholder="e.g. 61091000" {...register(`${path}.ritcCode`)} />
        <Select<ShippingBillFormValues>
          label="Scheme code"
          name={`${path}.schemeCode`}
          options={options.schemes}
          placeholder="Select scheme"
        />
        <Input
          label="Goods description"
          placeholder="e.g. Cotton T-shirts"
          wrapClass="lg:col-span-4"
          {...register(`${path}.goodsDescription1`)}
        />
        <Input label="Quantity" type={numberInputType} {...register(`${path}.quantity`)} />
        <Select<ShippingBillFormValues>
          label="Unit"
          name={`${path}.unitOfMeasurement`}
          options={options.quantityUnits}
          rules={rulesFor('unitOfMeasurement')}
        />
        <Input label={`Unit price (${currency})`} type={numberInputType} {...register(`${path}.unitPrice`)} />
        <Input
          label="Item total"
          type={numberInputType}
          placeholder={`${currency} ${formatAmount(total)}`}
          {...register(`${path}.lineTotal`)}
        />
        <Select<ShippingBillFormValues>
          label="IGST payment"
          name={`${path}.igstPaymentStatus`}
          options={options.igstPaymentStatuses}
          placeholder="Select if applicable"
        />
      </div>

      <div className="mb-3 flex flex-wrap items-end gap-4">
        {/* Drawback details only apply to schemes with an export incentive. */}
        {scheme?.hasExportIncentive === true && (
          <>
            <Input label="Drawback serial no." wrapClass="w-36" {...register(`${path}.drawbackSerialNumber`)} />
            <Input label="Drawback unit" wrapClass="w-32" {...register(`${path}.drawbackUnit`)} />
            <Input
              label="Drawback quantity"
              type={numberInputType}
              wrapClass="w-36"
              {...register(`${path}.drawbackQuantity`)}
            />
          </>
        )}
        <label className="flex items-center gap-2 pb-1 text-sm">
          <Checkbox {...register(`${path}.rewardItem`)} />
          Claim reward
        </label>
        <label className="flex items-center gap-2 pb-1 text-sm">
          <Checkbox {...register(`${path}.thirdPartyItem`)} />
          Third-party item
        </label>
      </div>

      {item?.thirdPartyItem === true && (
        <div className="my-4">
          <PartyBranchFields
            kind="business"
            role="thirdParty"
            label="Item third party"
            ownerField={`${path}.itemThirdPartyId`}
            branchField={`${path}.itemThirdPartyBranchId`}
          />
        </div>
      )}

      <Collapsible title="Item customs, taxes and incentives">
        <div className="mb-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select<ShippingBillFormValues>
            label="Unit of rate"
            name={`${path}.unitOfRate`}
            options={options.quantityUnits}
            placeholder={item?.unitOfMeasurement ?? 'Same as unit'}
          />
          <Input
            label="Per unit (rate)"
            type={numberInputType}
            placeholder="1"
            {...register(`${path}.numberOfUnits`)}
          />
          <Input label="Present market value" type={numberInputType} {...register(`${path}.presentMarketValue`)} />
          <Input label="GCess" type={numberInputType} {...register(`${path}.cess`)} />
          <Input
            label="Accessories description"
            wrapClass="lg:col-span-3"
            {...register(`${path}.accessoriesDescription`)}
          />
          <Select<ShippingBillFormValues>
            label="Accessory status"
            name={`${path}.accessoryStatus`}
            options={options.accessoryStatuses}
            placeholder="Select if relevant"
          />
          {/* Taxable value and IGST amount only apply when IGST is paid. */}
          {item?.igstPaymentStatus === 'P' && (
            <>
              <Input label="Taxable value" type={numberInputType} {...register(`${path}.taxableValue`)} />
              <Input label="IGST amount" type={numberInputType} {...register(`${path}.igstAmount`)} />
            </>
          )}
          <Input label="Origin district code" {...register(`${path}.originDistrictCode`)} />
          <Select<ShippingBillFormValues>
            label="Trade agreement code"
            name={`${path}.tradeAgreementsCode`}
            options={options.tradeAgreements}
            placeholder="NCPTI"
          />
          <Input label="End use code" {...register(`${path}.endUseOfItem`)} />
          <Input label="Packages for item" type={numberInputType} {...register(`${path}.totalPackage`)} />
        </div>
        <Collapsible title="AR4 / excise details">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input label="AR4 number" {...register(`${path}.ar4Number`)} />
            <Input label="AR4 date" type={dateInputType} {...register(`${path}.ar4Date`)} />
          </div>
        </Collapsible>
      </Collapsible>
    </ListItemCard>
  )
}

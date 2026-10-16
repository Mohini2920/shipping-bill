import { Card, CardContent } from 'ui/basic/card'
import { useFieldArray } from 'ui/form'
import { Input } from 'ui/inputs/input'
import { Select } from 'ui/inputs/select'
import { emptyContainer, emptyDocument, emptyLicense, emptyPackingRange } from '../domain/defaults'
import type { ShippingBillFormValues } from '../domain/types'
import { packingRangeEndRules } from '../domain/validation'
import { useFormOptions } from '../hooks/form-options-context'
import { useBillForm } from '../hooks/use-bill-form'
import { DocumentCard } from './document-card'
import { ListItemCard, ListSection } from './form-layout'
import { dateInputType, numberInputType } from './input-types'

/** Tab 3: containers, packing ranges, supporting documents and licences. All are optional lists. */
export function OthersTab() {
  return (
    <>
      <Card>
        <CardContent className="space-y-8 pt-6">
          <ContainerList />
          <PackingRangeList />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <DocumentList />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <LicenseList />
        </CardContent>
      </Card>
    </>
  )
}

function ContainerList() {
  const { register, control } = useBillForm()
  const options = useFormOptions()
  const containers = useFieldArray({ control, name: 'containers' })

  return (
    <ListSection
      title={`Containers (${containers.fields.length})`}
      description="Add only when the cargo is containerized."
      addLabel="+ Add container"
      onAdd={() => containers.append(emptyContainer())}
      isEmpty={containers.fields.length === 0}
      emptyMessage="No containers added.">
      {containers.fields.map((field, index) => (
        <ListItemCard key={field.id} title={`Container ${index + 1}`} onRemove={() => containers.remove(index)}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input label="Container number" {...register(`containers.${index}.containerNumber`)} />
            <Select<ShippingBillFormValues>
              label="Size"
              name={`containers.${index}.containerSize`}
              options={options.containerSizes}
              placeholder="Select size"
            />
            <Input label="Seal number" {...register(`containers.${index}.exciseSealNumber`)} />
            <Input label="Seal date" type={dateInputType} {...register(`containers.${index}.sealDate`)} />
            <Select<ShippingBillFormValues>
              label="Seal type"
              name={`containers.${index}.sealType`}
              options={options.containerSealTypes}
              placeholder="Select if needed"
            />
            <Input label="Seal device ID" {...register(`containers.${index}.sealDeviceId`)} />
            <Input label="Movement document type" {...register(`containers.${index}.movementDocumentType`)} />
            <Input label="Movement document number" {...register(`containers.${index}.movementDocumentNumber`)} />
          </div>
        </ListItemCard>
      ))}
    </ListSection>
  )
}

function PackingRangeList() {
  const { register, control } = useBillForm()
  const ranges = useFieldArray({ control, name: 'packingRanges' })

  return (
    <ListSection
      title={`Packing list ranges (${ranges.fields.length})`}
      description="Package numbers covered by this shipment, e.g. 1 to 120."
      addLabel="+ Add packing range"
      onAdd={() => ranges.append(emptyPackingRange())}
      isEmpty={ranges.fields.length === 0}
      emptyMessage="No packing ranges added.">
      {ranges.fields.map((field, index) => (
        <ListItemCard key={field.id} title={`Range ${index + 1}`} onRemove={() => ranges.remove(index)}>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Package from"
              type={numberInputType}
              {...register(`packingRanges.${index}.packingNumberFrom`)}
            />
            <Input
              label="Package to"
              type={numberInputType}
              {...register(`packingRanges.${index}.packingNumberTo`, packingRangeEndRules(index))}
            />
            <Input label="Packing code" placeholder="CTN" {...register(`packingRanges.${index}.packingCode`)} />
          </div>
        </ListItemCard>
      ))}
    </ListSection>
  )
}

function DocumentList() {
  const { control } = useBillForm()
  const documents = useFieldArray({ control, name: 'documents' })

  return (
    <ListSection
      title="Supporting documents"
      description="Add references when required for this shipment."
      addLabel="+ Add document"
      onAdd={() => documents.append(emptyDocument())}
      isEmpty={documents.fields.length === 0}
      emptyMessage="No documents added.">
      {documents.fields.map((field, index) => (
        <DocumentCard key={field.id} index={index} onRemove={() => documents.remove(index)} />
      ))}
    </ListSection>
  )
}

function LicenseList() {
  const { register, control } = useBillForm()
  const options = useFormOptions()
  const licenses = useFieldArray({ control, name: 'licenses' })

  return (
    <ListSection
      title="Licences"
      description="Only for schemes that require a licence."
      addLabel="+ Add licence"
      onAdd={() => licenses.append(emptyLicense())}
      isEmpty={licenses.fields.length === 0}
      emptyMessage="No licences added.">
      {licenses.fields.map((field, index) => {
        const path = `licenses.${index}` as const
        return (
          <ListItemCard key={field.id} title={`Licence ${index + 1}`} onRemove={() => licenses.remove(index)}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Input label="Registration number" {...register(`${path}.registrationNumber`)} />
              <Input label="Registration date" type={dateInputType} {...register(`${path}.registrationDate`)} />
              <Input
                label="Invoice serial number"
                type={numberInputType}
                {...register(`${path}.invoiceSerialNumber`)}
              />
              <Input label="Item serial number" type={numberInputType} {...register(`${path}.itemSerialNumber`)} />
              <Input
                label="Licence serial number"
                type={numberInputType}
                {...register(`${path}.licenseSerialNumber`)}
              />
              <Input label="Item serial, Part E" {...register(`${path}.itemSerialNumberPartE`)} />
              <Input label="Item serial, Part C" {...register(`${path}.itemSerialNumberPartC`)} />
              <Input label="Licence quantity" type={numberInputType} {...register(`${path}.licenseQuantity`)} />
              <Input label="Export quantity" type={numberInputType} {...register(`${path}.licenseExportQuantity`)} />
              <Select<ShippingBillFormValues>
                label="Goods source"
                name={`${path}.indigenousOrImported`}
                options={options.goodsSources}
                placeholder="Select if needed"
              />
            </div>
          </ListItemCard>
        )
      })}
    </ListSection>
  )
}

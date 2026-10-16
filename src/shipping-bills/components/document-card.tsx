import { Input } from 'ui/inputs/input'
import { Select } from 'ui/inputs/select'
import { referenceDataService } from '../api'
import { queryKeys } from '../api/query-keys'
import type { ShippingBillFormValues, SupportingDocForm } from '../domain/types'
import { documentExpiryRules } from '../domain/validation'
import { useFormOptions } from '../hooks/form-options-context'
import { useBillForm } from '../hooks/use-bill-form'
import { AsyncSelect } from './async-select'
import { Collapsible, ListItemCard } from './form-layout'
import { dateInputType, numberInputType } from './input-types'

type DocumentField = keyof SupportingDocForm

const issuingPartyFields: [DocumentField, string][] = [
  ['issuingPartyCode', 'Issuing party code'],
  ['issuingPartyName', 'Issuing party name'],
  ['issuingPartyAddress1', 'Address line 1'],
  ['issuingPartyAddress2', 'Address line 2'],
  ['issuingPartyCity', 'City'],
  ['issuingPartyPin', 'Postal code']
]

const beneficiaryPartyFields: [DocumentField, string][] = [
  ['beneficiaryPartyCode', 'Beneficiary code'],
  ['beneficiaryPartyName', 'Beneficiary name'],
  ['beneficiaryPartyAddress1', 'Address line 1'],
  ['beneficiaryPartyAddress2', 'Address line 2'],
  ['beneficiaryPartyCity', 'City'],
  ['beneficiaryPartyPin', 'Postal code']
]

async function searchDocumentTypes(query: string) {
  return referenceDataService.searchDocumentTypes(query)
}

async function resolveDocumentTypeLabel(code: string) {
  const matches = await referenceDataService.searchDocumentTypes(code)
  return matches.find((type) => type.value === code)?.label
}

interface DocumentCardProps {
  index: number
  onRemove: () => void
}

/** One supporting document (e-Sanchit reference). */
export function DocumentCard({ index, onRemove }: DocumentCardProps) {
  const { register, getValues } = useBillForm()
  const { fileTypes } = useFormOptions()
  const path = `documents.${index}` as const

  // Open the optional section straight away when an existing document already uses it.
  const saved = getValues(path) as SupportingDocForm | undefined
  const hasOptionalDetails = [...issuingPartyFields, ...beneficiaryPartyFields]
    .map(([field]) => field)
    .concat(['documentExpiryDate', 'invoiceSerialNumber', 'itemSerialNumber', 'fileType', 'placeOfIssue'])
    .some((field) => Boolean(saved?.[field]))

  return (
    <ListItemCard title={`Document ${index + 1}`} onRemove={onRemove}>
      <div className="mb-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AsyncSelect
          name={`${path}.documentTypeCode`}
          label="Document type"
          placeholder="Search document type..."
          searchKey={queryKeys.documentTypes}
          search={searchDocumentTypes}
          labelKey={(code) => [...queryKeys.documentTypes(code), 'label']}
          resolveLabel={resolveDocumentTypeLabel}
        />
        <Input label="Reference number" {...register(`${path}.documentReferenceNumber`)} />
        <Input label="Image reference number" {...register(`${path}.imageReferenceNumber`)} />
        <Input label="Issue date" type={dateInputType} {...register(`${path}.documentIssueDate`)} />
      </div>
      <Collapsible title="Issuing party and ICEGATE details" defaultOpen={hasOptionalDetails}>
        <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            label="Expiry date"
            type={dateInputType}
            {...register(`${path}.documentExpiryDate`, documentExpiryRules(index))}
          />
          <Input label="Invoice serial number" type={numberInputType} {...register(`${path}.invoiceSerialNumber`)} />
          <Input label="Item serial number" type={numberInputType} {...register(`${path}.itemSerialNumber`)} />
          <Select<ShippingBillFormValues>
            label="File type"
            name={`${path}.fileType`}
            options={fileTypes}
            placeholder="Select file type"
          />
          <Input label="Place of issue" {...register(`${path}.placeOfIssue`)} />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <AddressFields title="Issuing party" index={index} fields={issuingPartyFields} />
          <AddressFields title="Beneficiary" index={index} fields={beneficiaryPartyFields} />
        </div>
      </Collapsible>
    </ListItemCard>
  )
}

interface AddressFieldsProps {
  title: string
  index: number
  fields: [DocumentField, string][]
}

function AddressFields({ title, index, fields }: AddressFieldsProps) {
  const { register } = useBillForm()

  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold">{title}</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map(([field, label]) => (
          <Input key={field} label={label} {...register(`documents.${index}.${field}`)} />
        ))}
      </div>
    </fieldset>
  )
}

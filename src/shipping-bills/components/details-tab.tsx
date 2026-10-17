import { useQuery } from 'core/react-query'
import { Card, CardContent, CardHeader } from 'ui/basic/card'
import { useWatch } from 'ui/form'
import { Input } from 'ui/inputs/input'
import { Select } from 'ui/inputs/select'
import { referenceDataService } from '../api'
import { queryKeys } from '../api/query-keys'
import { countryFromPortCode } from '../domain/calculations'
import type { Port, ShippingBillFormValues } from '../domain/types'
import { useFormOptions } from '../hooks/form-options-context'
import { useBillForm } from '../hooks/use-bill-form'
import { AsyncSelect } from './async-select'
import { Collapsible, SectionHeading } from './form-layout'
import { dateInputType, numberInputType } from './input-types'
import { PartyBranchFields } from './party-branch-fields'

function toPortOptions(ports: Port[]) {
  return ports.map((port) => ({
    value: port.code,
    label: `${port.name} · ${port.code}`,
    sublabel: `Country: ${port.countryCode}`
  }))
}

async function resolvePortLabel(code: string) {
  const port = await referenceDataService.getPort(code)
  return port ? `${port.name} · ${port.code}` : undefined
}

/** Tab 1: parties, route and package details. */
export function DetailsTab() {
  const { register, control, setValue } = useBillForm()
  const options = useFormOptions()
  const [loadingPort, destinationPort, containers] = useWatch({
    control,
    name: ['loadingPort', 'finalDestinationPort', 'containers']
  })

  return (
    <Card>
      <CardHeader title="Shipment basics" description="Parties and route are the core details of this bill." />
      <CardContent className="space-y-5">
        <PartyBranchFields
          kind="exporter"
          label="Exporter"
          ownerField="exporterId"
          branchField="exporterBranchId"
          // Saved marks belong to an exporter, so a new exporter clears the old choice.
          onOwnerChange={() => setValue('marksAndNumbers', '')}
        />
        <PartyBranchFields
          kind="business"
          role="consignee"
          label="Consignee"
          ownerField="consigneeId"
          branchField="consigneeBranchId"
        />

        <section className="space-y-4 border-t pt-5">
          <SectionHeading title="Route" />
          <div className="grid gap-4 sm:grid-cols-2">
            <AsyncSelect
              name="loadingPort"
              label="Port of loading"
              placeholder="Select an Indian port"
              searchKey={queryKeys.loadingPorts}
              search={async (query) => toPortOptions(await referenceDataService.searchLoadingPorts(query))}
              labelKey={(code) => [...queryKeys.port(code), 'label']}
              resolveLabel={resolvePortLabel}
            />
            <AsyncSelect
              name="finalDestinationPort"
              label="Final destination port"
              placeholder="Select destination"
              searchKey={queryKeys.destinationPorts}
              search={async (query) => toPortOptions(await referenceDataService.searchDestinationPorts(query))}
              labelKey={(code) => [...queryKeys.port(code), 'label']}
              resolveLabel={resolvePortLabel}
            />
          </div>
          <p className="text-xs text-gray-500">
            Countries are derived from the port codes: {countryFromPortCode(loadingPort) || '—'} →{' '}
            {countryFromPortCode(destinationPort) || '—'}
          </p>
          <Collapsible title="Regulatory and route exceptions">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Select<ShippingBillFormValues>
                label="Discharge port"
                name="dischargePort"
                options={options.destinationPorts}
                placeholder="Defaults to destination"
              />
              <Select<ShippingBillFormValues>
                label="Origin state"
                name="originStateCode"
                options={options.states}
                placeholder="Select state"
              />
              <Select<ShippingBillFormValues>
                label="NFEI category"
                name="nfeiCategory"
                options={options.nfeiCategories}
                placeholder="Not applicable"
              />
              <Input label="RBI waiver number" {...register('rbiWaiverNumber')} />
              <Input label="RBI waiver date" type={dateInputType} {...register('rbiWaiverDate')} />
            </div>
          </Collapsible>
        </section>

        <section className="space-y-4 border-t pt-5">
          <SectionHeading title="Package details" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Select<ShippingBillFormValues> label="Nature of cargo" name="natureOfCargo" options={options.cargoTypes} />
            <Input label="Gross weight" type={numberInputType} {...register('grossWeight')} />
            <Input label="Net weight" type={numberInputType} {...register('netWeight')} />
            <Select<ShippingBillFormValues> label="Weight unit" name="measurementUnit" options={options.weightUnits} />
            <Input label="Total packages" type={numberInputType} {...register('totalPackages')} />
            <MarksAndNumbersSelect />
          </div>
          <Collapsible title="Additional details">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Select<ShippingBillFormValues>
                label="Seal type"
                name="sealType"
                options={options.sealTypes}
                placeholder="Select if relevant"
              />
              {/* With containers listed, the count comes from the list instead. */}
              {containers.length === 0 && (
                <Input label="Number of containers" type={numberInputType} {...register('numberOfContainers')} />
              )}
              <Input label="Loose packets" type={numberInputType} {...register('loosePackets')} />
              <Input label="MAWB number" {...register('mawbNumber')} />
              <Input label="HAWB number" {...register('hawbNumber')} />
            </div>
          </Collapsible>
        </section>
      </CardContent>
    </Card>
  )
}

/** Shipping marks depend on the exporter, so they load whenever the exporter changes. */
function MarksAndNumbersSelect() {
  const { control } = useBillForm()
  const [exporterId, savedMark] = useWatch({ control, name: ['exporterId', 'marksAndNumbers'] })
  const marks = useQuery({
    queryKey: queryKeys.marksAndNumbers(Number(exporterId)),
    queryFn: () => referenceDataService.getMarksAndNumbers(Number(exporterId)),
    enabled: exporterId !== ''
  })

  let placeholder = 'Select marks and numbers'
  if (exporterId === '') placeholder = 'Select the exporter first'
  else if (marks.isPending) placeholder = 'Loading marks and numbers...'
  else if (marks.isError) placeholder = 'Could not load marks and numbers'
  else if (marks.data.length === 0) placeholder = 'No saved marks for this exporter'

  return (
    <Select<ShippingBillFormValues>
      label="Marks and numbers"
      name="marksAndNumbers"
      options={marks.data ?? []}
      placeholder={placeholder}
      // react-hook-form leaves disabled fields out of the saved values, so a field that already
      // holds a mark stays enabled while the options load; otherwise a quick save would erase it.
      disabled={exporterId === '' || (!marks.data?.length && !savedMark)}
      wrapClass="sm:col-span-3"
    />
  )
}

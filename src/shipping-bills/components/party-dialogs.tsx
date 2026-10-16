import { InferType, s, useForm } from 'core/form'
import { Form, SubmitButton } from 'core/form/components'
import { queryClient } from 'core/react-query'
import { toast } from 'core/toast-manager'
import { describeError } from 'core/utils'
import { Button } from 'ui/basic/button'
import { Checkbox } from 'ui/inputs/checkbox'
import { Input } from 'ui/inputs/input'
import { Select } from 'ui/inputs/select'
import { Textarea } from 'ui/inputs/text-area'
import { Dialog, DialogContent } from 'ui/interactive/dialog'
import { partyService } from '../api'
import { queryKeys } from '../api/query-keys'
import type { Branch, BusinessRole, Party, PartyKind } from '../domain/types'
import { useFormOptions } from '../hooks/form-options-context'

const branchFields = {
  branchName: s.string().requiredMsg('Enter a branch name'),
  address1: s.string().requiredMsg('Enter the address'),
  address2: s.string().optional(),
  city: s.string().requiredMsg('Enter the city'),
  state: s.string().optional(),
  pincode: s.string().optional(),
  countryCode: s.string().requiredMsg('Select a country')
}

const partySchema = s.object({
  name: s.string().requiredMsg('Enter a name').minVal(2),
  iec: s
    .string()
    .optional()
    .matches(/^[A-Za-z0-9]{10}$/, 'IEC is 10 letters or digits'),
  class: s.string().optional(),
  type: s.string().optional(),
  pan: s.string().optional(),
  tan: s.string().optional(),
  aeoNumber: s.string().optional(),
  website: s.string().optional(),
  notes: s.string().optional(),
  isConsignee: s.boolean().optional(),
  isBuyer: s.boolean().optional(),
  isNotify: s.boolean().optional(),
  isThirdParty: s.boolean().optional(),
  ...branchFields
})

type PartyFields = InferType<typeof partySchema>

const businessRoles = [
  ['isConsignee', 'Consignee'],
  ['isBuyer', 'Buyer'],
  ['isNotify', 'Notify party'],
  ['isThirdParty', 'Third party']
] as const

interface PartyDialogProps {
  kind: PartyKind
  /** Role the new business is being added for; it is pre-ticked. */
  role?: BusinessRole
  onClose: () => void
  onSaved: (party: Party) => void
}

export function PartyDialog({ kind, role, onClose, onSaved }: PartyDialogProps) {
  const options = useFormOptions()
  const formCtx = useForm<PartyFields>(partySchema, {
    defaultValues: {
      name: '',
      iec: '',
      class: kind === 'exporter' ? 'F' : undefined,
      type: kind === 'exporter' ? 'P' : undefined,
      isConsignee: role === 'consignee',
      isBuyer: role === 'buyer',
      isNotify: false,
      isThirdParty: role === 'thirdParty',
      branchName: '',
      address1: '',
      city: '',
      countryCode: kind === 'exporter' ? 'IN' : ''
    }
  })
  const { register, setError } = formCtx.hooks

  async function handleSave(values: PartyFields) {
    const { branchName, address1, address2, city, state, pincode, countryCode, ...party } = values
    try {
      const saved = await partyService.createParty(kind, {
        ...party,
        firstBranch: { branchName, address1, address2, city, state, pincode, countryCode }
      })
      await queryClient.invalidateQueries({ queryKey: queryKeys.parties })
      toast.success(`${saved.name} added`)
      onSaved(saved)
    } catch (error) {
      // Handled here rather than by <Form>, whose automatic retry could create the party twice.
      const { message, description } = describeError(error)
      setError('root', { message, type: description })
    }
  }

  return (
    <DialogFrame title={`Add ${kind}`} onClose={onClose}>
      <p className="mb-5 text-sm text-gray-500">
        Add the main details and one address. More branches can be added later.
      </p>
      <Form ctx={formCtx} handleSubmit={handleSave} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Name" {...register('name')} wrapClass="sm:col-span-2" />
          <Input label="IEC" {...register('iec')} />
          {kind === 'exporter' ? (
            <>
              <Select<PartyFields> label="Exporter class" name="class" options={options.exporterClasses} />
              <Select<PartyFields> label="Exporter type" name="type" options={options.exporterTypes} />
            </>
          ) : (
            <fieldset className="sm:col-span-2">
              <legend className="mb-2 text-sm font-medium">Used as</legend>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                {businessRoles.map(([name, label]) => (
                  <label key={name} className="flex items-center gap-2">
                    <Checkbox {...register(name)} />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
        </div>
        {kind === 'exporter' && (
          <details className="rounded-lg border p-3">
            <summary className="cursor-pointer text-sm font-medium">More exporter details</summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input label="PAN" {...register('pan')} />
              <Input label="TAN" {...register('tan')} />
              <Input label="AEO number" {...register('aeoNumber')} />
              <Input label="Website" {...register('website')} />
              <Textarea label="Notes" {...register('notes')} wrapClass="sm:col-span-2" />
            </div>
          </details>
        )}
        <section className="border-t pt-4">
          <h3 className="mb-3 font-medium">First branch</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Branch name" {...register('branchName')} />
            <Input label="Address line 1" {...register('address1')} />
            <Input label="City" {...register('city')} />
            <Select<PartyFields>
              label="Country"
              name="countryCode"
              options={options.countries}
              placeholder="Select country"
            />
            <Input label="State / province" {...register('state')} />
            <Input label="Postal code" {...register('pincode')} />
          </div>
        </section>
        <DialogActions onClose={onClose} submitLabel={`Save ${kind}`} />
      </Form>
    </DialogFrame>
  )
}

const branchSchema = s.object({
  ...branchFields,
  email: s.string().optional(),
  mobile: s.string().optional(),
  gstnId: s.string().optional(),
  adCode: s.string().optional(),
  accountNo: s.string().optional(),
  ifscCode: s.string().optional()
})

type BranchFields = InferType<typeof branchSchema>

interface BranchDialogProps {
  kind: PartyKind
  ownerId: number
  onClose: () => void
  onSaved: (branch: Branch) => void
}

export function BranchDialog({ kind, ownerId, onClose, onSaved }: BranchDialogProps) {
  const options = useFormOptions()
  const formCtx = useForm<BranchFields>(branchSchema, {
    defaultValues: { branchName: '', address1: '', city: '', countryCode: kind === 'exporter' ? 'IN' : '' }
  })
  const { register, setError } = formCtx.hooks

  async function handleSave(values: BranchFields) {
    try {
      const saved = await partyService.createBranch(kind, ownerId, values)
      await queryClient.invalidateQueries({ queryKey: queryKeys.parties })
      toast.success(`Branch ${saved.branchName} added`)
      onSaved(saved)
    } catch (error) {
      const { message, description } = describeError(error)
      setError('root', { message, type: description })
    }
  }

  return (
    <DialogFrame title="Add branch" onClose={onClose}>
      <Form ctx={formCtx} handleSubmit={handleSave} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Branch name" {...register('branchName')} />
          <Input label="Address line 1" {...register('address1')} />
          <Input label="Address line 2" {...register('address2')} />
          <Input label="City" {...register('city')} />
          <Input label="State / province" {...register('state')} />
          <Input label="Postal code" {...register('pincode')} />
          <Select<BranchFields>
            label="Country"
            name="countryCode"
            options={options.countries}
            placeholder="Select country"
          />
          <Input label="Email" type="email" {...register('email')} />
          <Input label="Mobile" {...register('mobile')} />
          <Input label="GSTIN / tax ID" {...register('gstnId')} />
        </div>
        {kind === 'exporter' && (
          <details className="rounded-lg border p-3">
            <summary className="cursor-pointer text-sm font-medium">Bank and customs details</summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input label="AD code" {...register('adCode')} />
              <Input label="Account number" {...register('accountNo')} />
              <Input label="IFSC code" {...register('ifscCode')} />
            </div>
          </details>
        )}
        <DialogActions onClose={onClose} submitLabel="Save branch" />
      </Form>
    </DialogFrame>
  )
}

interface DialogFrameProps {
  title: string
  onClose: () => void
  children: React.ReactNode
}

function DialogFrame({ title, onClose, children }: DialogFrameProps) {
  return (
    <Dialog open setOpen={(open) => !open && onClose()}>
      <DialogContent center>
        {/* The dialog renders in a portal, but React still bubbles its submit event up the component
            tree to the shipping bill <form>. Stopping it here keeps the two forms independent. */}
        <div
          onSubmit={(event) => event.stopPropagation()}
          className="foreground max-h-[90vh] w-[min(92vw,42rem)] overflow-y-auto rounded-xl border p-6 shadow-xl">
          <h2 className="mb-2 text-lg font-semibold">{title}</h2>
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DialogActions({ onClose, submitLabel }: { onClose: () => void; submitLabel: string }) {
  return (
    <div className="flex justify-end gap-2 border-t pt-4">
      <Button variant="outline" onClick={onClose}>
        Cancel
      </Button>
      <SubmitButton>{submitLabel}</SubmitButton>
    </div>
  )
}

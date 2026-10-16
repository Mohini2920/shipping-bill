import { useState } from 'react'
import { Path, useWatch } from 'ui/form'
import { partyService } from '../api'
import { queryKeys } from '../api/query-keys'
import type { Branch, BusinessRole, Party, PartyKind, ShippingBillFormValues } from '../domain/types'
import { branchRules, partyRules } from '../domain/validation'
import { useBillForm } from '../hooks/use-bill-form'
import { AsyncSelect } from './async-select'
import { BranchDialog, PartyDialog } from './party-dialogs'

type BillField = Path<ShippingBillFormValues>

interface PartyBranchFieldsProps {
  kind: PartyKind
  /** Which businesses to offer. Required when kind is 'business'. */
  role?: BusinessRole
  label: string
  ownerField: BillField
  branchField: BillField
  required?: boolean
  /** Called after the user picks a different party. */
  onOwnerChange?: () => void
}

function branchLabel(branch: Branch) {
  return `${branch.branchName} · ${branch.city}`
}

/**
 * A party (exporter or business) and one of its branches. Used for the exporter, consignee, buyer
 * and both kinds of third party. Owns its "Add new" dialogs, so the bill editor does not need to
 * track which field a new party or branch belongs to.
 */
export function PartyBranchFields({
  kind,
  role,
  label,
  ownerField,
  branchField,
  required = true,
  onOwnerChange
}: PartyBranchFieldsProps) {
  const { control, setValue } = useBillForm()
  const ownerValue = useWatch({ control, name: ownerField }) as string | undefined
  const ownerId = ownerValue ? Number(ownerValue) : undefined
  const [dialog, setDialog] = useState<'party' | 'branch' | null>(null)
  const noun = kind === 'exporter' ? 'exporter' : 'business'

  function searchParties(query: string) {
    const request =
      kind === 'exporter' ? partyService.searchExporters(query) : partyService.searchBusinesses(role!, query)
    return request.then((parties: Party[]) =>
      parties.map((party) => ({
        value: String(party.id),
        label: party.name,
        sublabel: party.iec ? `IEC: ${party.iec}` : undefined
      }))
    )
  }

  async function searchBranches(query: string) {
    const branches = await partyService.searchBranches(kind, ownerId!, query)
    return branches.map((branch) => ({
      value: String(branch.id),
      label: branchLabel(branch),
      sublabel: branch.address1
    }))
  }

  async function resolveBranchLabel(id: string) {
    const branches = await partyService.searchBranches(kind, ownerId!, '')
    const branch = branches.find((item) => String(item.id) === id)
    return branch ? branchLabel(branch) : undefined
  }

  function selectOwner(id: string, branchId = '') {
    setValue(ownerField, id, { shouldValidate: true, shouldDirty: true })
    setValue(branchField, branchId, { shouldValidate: branchId !== '', shouldDirty: true })
    onOwnerChange?.()
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <AsyncSelect
        name={ownerField}
        label={label}
        labelAction={<AddButton onClick={() => setDialog('party')}>+ Add new</AddButton>}
        placeholder={`Search ${noun}...`}
        rules={partyRules(label, required)}
        searchKey={(query) => queryKeys.partySearch(kind, role, query)}
        search={searchParties}
        labelKey={(id) => [...queryKeys.party(kind, Number(id)), 'label']}
        resolveLabel={async (id) => (await partyService.getParty(kind, Number(id)))?.name}
        onValueChange={(id) => selectOwner(id)}
        emptyMessage={`No matching ${noun}. Use "Add new" to create one.`}
      />
      <AsyncSelect
        // Remount when the party changes so the branch search and label start fresh.
        key={ownerValue ?? 'none'}
        name={branchField}
        label="Branch / address"
        labelAction={ownerId != null && <AddButton onClick={() => setDialog('branch')}>+ Add branch</AddButton>}
        placeholder={ownerId == null ? `Choose the ${noun} first` : 'Search branch...'}
        disabled={ownerId == null}
        rules={branchRules(ownerField)}
        searchKey={(query) => queryKeys.branchSearch(kind, ownerId ?? 0, query)}
        search={searchBranches}
        labelKey={(id) => [...queryKeys.branchSearch(kind, ownerId ?? 0, ''), 'label', id]}
        resolveLabel={resolveBranchLabel}
        emptyMessage='No branches found. Use "Add branch" to create one.'
      />

      {dialog === 'party' && (
        <PartyDialog
          kind={kind}
          role={role}
          onClose={() => setDialog(null)}
          onSaved={(party) => {
            selectOwner(String(party.id), String(party.branches[0]?.id ?? ''))
            setDialog(null)
          }}
        />
      )}
      {dialog === 'branch' && ownerId != null && (
        <BranchDialog
          kind={kind}
          ownerId={ownerId}
          onClose={() => setDialog(null)}
          onSaved={(branch) => {
            setValue(branchField, String(branch.id), { shouldValidate: true, shouldDirty: true })
            setDialog(null)
          }}
        />
      )}
    </div>
  )
}

function AddButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className="text-primary-600 text-xs font-medium hover:underline" onClick={onClick}>
      {children}
    </button>
  )
}

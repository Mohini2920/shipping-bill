import { useQuery } from 'core/react-query'
import { RrCaretDown } from 'icons/rr/fi-rr-caret-down'
import { useState } from 'react'
import { getFormContext, getNestedSchema, RegisterOptions, useController } from 'ui/form'
import { InputError } from 'ui/inputs/error'
import { Label } from 'ui/inputs/label'
import { Popover, PopoverContent, PopoverTrigger } from 'ui/interactive/popover'
import { PopoverContext } from 'ui/interactive/popover-context'
import { clsxJoin, getContext } from 'ui/utils'
import type { Option } from '../domain/types'
import type { BillRules } from '../domain/validation'
import { useDebouncedValue } from '../hooks/use-debounced-value'

type QueryKey = readonly unknown[]

interface AsyncSelectProps {
  name: string
  label?: string
  /** Rendered on the right of the label, e.g. an "Add new" button. */
  labelAction?: React.ReactNode
  placeholder?: string
  disabled?: boolean
  /** Extra rules, merged over the schema rules for this field. */
  rules?: BillRules
  /** Cache key for one search; must include everything the search depends on. */
  searchKey: (query: string) => QueryKey
  search: (query: string) => Promise<Option[]>
  /** Resolves the label of an already saved value, e.g. when an existing bill is opened. */
  labelKey?: (value: string) => QueryKey
  resolveLabel?: (value: string) => Promise<string | undefined>
  /** Called when the user picks an option (not when the form is reset or loaded). */
  onValueChange?: (value: string) => void
  emptyMessage?: string
}

/**
 * A searchable select whose options come from an async service call. react-query handles loading,
 * errors, caching and out-of-order responses, so this component only renders those states.
 */
export function AsyncSelect({
  name,
  label,
  labelAction,
  placeholder = 'Search...',
  disabled = false,
  rules,
  searchKey,
  search,
  labelKey,
  resolveLabel,
  onValueChange,
  emptyMessage = 'No matching results'
}: AsyncSelectProps) {
  const form = getFormContext()
  const {
    field: { onChange, value, ref }
  } = useController({
    name,
    control: form.hooks.control,
    rules: { ...(getNestedSchema(name, form.schema) as RegisterOptions | undefined), ...(rules as RegisterOptions) },
    disabled
  })
  const currentValue = typeof value === 'string' ? value : ''

  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query)
  // Label of the option the user just picked, so it shows without another request.
  const [picked, setPicked] = useState<Option | null>(null)

  const results = useQuery({
    queryKey: searchKey(debouncedQuery),
    queryFn: () => search(debouncedQuery),
    enabled: isOpen && !disabled
  })

  const needsLabel = currentValue !== '' && picked?.value !== currentValue && resolveLabel != null
  const savedLabel = useQuery({
    queryKey: labelKey?.(currentValue) ?? ['label', name, currentValue],
    queryFn: () => resolveLabel!(currentValue),
    enabled: needsLabel
  })

  let displayLabel = ''
  if (picked?.value === currentValue) displayLabel = picked.label
  else if (currentValue !== '') displayLabel = savedLabel.data ?? (savedLabel.isPending ? 'Loading...' : currentValue)

  function select(option: Option) {
    setPicked(option)
    setQuery('')
    onChange(option.value)
    onValueChange?.(option.value)
  }

  return (
    <div>
      {(label != null || labelAction != null) && (
        <div className="mb-1.5 flex items-center justify-between gap-2">
          {label != null && <Label>{label}</Label>}
          {labelAction}
        </div>
      )}
      <input type="hidden" name={name} value={currentValue} ref={ref} disabled={disabled} />
      <Popover placement="bottom-start" fallbackPlacements={['top-start']} onOpenCallback={setIsOpen}>
        <PopoverTrigger
          className={clsxJoin(
            'outline-focus-select group flex w-full items-center justify-between rounded-md border bg-inherit pr-2',
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          )}
          disabled={disabled}>
          <span className={clsxJoin('truncate p-2 text-left text-sm', displayLabel ? 'font-medium' : 'text-gray-500')}>
            {displayLabel || placeholder}
          </span>
          <RrCaretDown className="size-4 shrink-0 text-gray-500 transition-transform group-data-[state=open]:rotate-180" />
        </PopoverTrigger>
        <InputError<Record<string, unknown>> name={name} />
        <PopoverContent className="w-72 overflow-hidden">
          <div className="border-b p-2">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Type to search..."
              aria-label="Search options"
              className="outline-focus-input w-full rounded border bg-inherit px-2.5 py-1.5 text-sm"
              autoFocus
            />
          </div>
          <div className="max-h-56 overflow-y-auto p-1" role="listbox">
            {results.isPending ? (
              <p className="p-3 text-center text-xs text-gray-500">Loading...</p>
            ) : results.isError ? (
              <div className="p-3 text-center text-xs">
                <p className="text-red-500">Could not load options.</p>
                <button
                  type="button"
                  className="text-primary-600 mt-1 font-medium hover:underline"
                  onClick={() => void results.refetch()}>
                  Try again
                </button>
              </div>
            ) : results.data.length === 0 ? (
              <p className="p-3 text-center text-xs text-gray-500">{emptyMessage}</p>
            ) : (
              results.data.map((option) => (
                <OptionButton
                  key={option.value}
                  option={option}
                  selected={option.value === currentValue}
                  onSelect={select}
                />
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

interface OptionButtonProps {
  option: Option
  selected: boolean
  onSelect: (option: Option) => void
}

function OptionButton({ option, selected, onSelect }: OptionButtonProps) {
  const { setOpen } = getContext(PopoverContext)

  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={() => {
        onSelect(option)
        setOpen(false)
      }}
      className={clsxJoin(
        'flex w-full flex-col rounded p-2 text-left text-sm hover:bg-gray-100',
        selected && 'text-primary-600 font-semibold'
      )}>
      <span>{option.label}</span>
      {option.sublabel != null && <span className="text-xs text-gray-500">{option.sublabel}</span>}
    </button>
  )
}

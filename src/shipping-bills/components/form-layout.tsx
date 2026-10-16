import { Button } from 'ui/basic/button'

// Small layout pieces shared by the shipping bill sections.

export function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div>
      <h2 className="text-base font-semibold">{title}</h2>
      {description != null && <p className="mt-1 text-sm text-gray-500">{description}</p>}
    </div>
  )
}

interface CollapsibleProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

/** Optional, less common fields. Content stays mounted while collapsed, so it is still validated. */
export function Collapsible({ title, children, defaultOpen }: CollapsibleProps) {
  return (
    <details className="rounded-lg border p-4" open={defaultOpen}>
      <summary className="cursor-pointer text-sm font-medium">{title}</summary>
      <div className="mt-4">{children}</div>
    </details>
  )
}

interface TabPanelProps {
  active: boolean
  children: React.ReactNode
}

/**
 * Hides inactive tabs instead of unmounting them. Fields stay registered with react-hook-form,
 * so submitting from any tab validates the whole bill.
 */
export function TabPanel({ active, children }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={!active} className="mt-3 space-y-4">
      {children}
    </div>
  )
}

interface ListItemCardProps {
  title: string
  onRemove?: () => void
  children: React.ReactNode
}

/** One entry of a repeatable list (item, container, document...) with an optional Remove button. */
export function ListItemCard({ title, onRemove, children }: ListItemCardProps) {
  return (
    <div className="rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        {onRemove != null && (
          <Button size="sm" variant="ghost" onClick={onRemove}>
            Remove
          </Button>
        )}
      </div>
      {children}
    </div>
  )
}

interface ListSectionProps {
  title: string
  description?: string
  addLabel: string
  onAdd: () => void
  isEmpty: boolean
  emptyMessage: string
  children: React.ReactNode
}

/** Heading, "Add" button and empty state shared by every repeatable list on the form. */
export function ListSection({
  title,
  description,
  addLabel,
  onAdd,
  isEmpty,
  emptyMessage,
  children
}: ListSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHeading title={title} description={description} />
        <Button size="sm" variant="outline" onClick={onAdd}>
          {addLabel}
        </Button>
      </div>
      {isEmpty ? <p className="text-sm text-gray-500">{emptyMessage}</p> : <div className="space-y-3">{children}</div>}
    </section>
  )
}

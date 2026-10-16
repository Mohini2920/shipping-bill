import { Button } from 'ui/basic/button'
import { useFieldArray } from 'ui/form'
import { emptyInvoice } from '../domain/defaults'
import { useBillForm } from '../hooks/use-bill-form'
import { SectionHeading } from './form-layout'
import { InvoiceCard } from './invoice-card'

/** Tab 2: invoices and their goods. A bill always keeps at least one invoice. */
export function InvoicesTab() {
  const { control } = useBillForm()
  const invoices = useFieldArray({ control, name: 'invoices' })

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <SectionHeading title="Invoices & goods" description="Each invoice lists the goods it covers." />
        <Button variant="outline" onClick={() => invoices.append(emptyInvoice())}>
          + Add invoice
        </Button>
      </div>
      {invoices.fields.map((field, index) => (
        <InvoiceCard
          key={field.id}
          index={index}
          onRemove={invoices.fields.length > 1 ? () => invoices.remove(index) : undefined}
        />
      ))}
    </>
  )
}

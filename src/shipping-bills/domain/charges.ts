// Invoice-level charges. Each one can be entered either as a rate (%) or as an amount, never both,
// and may use its own currency (defaulting to the invoice currency). Listing them here lets the UI
// render one ChargeRow per entry instead of repeating the same markup five times.

export interface ChargeDefinition {
  label: string
  rateField: 'freightRate' | 'insuranceRate' | 'commissionRate' | 'discountRate' | 'otherDeductionsRate'
  amountField: 'freightAmount' | 'insuranceAmount' | 'commissionAmount' | 'discountAmount' | 'otherDeductionsAmount'
  currencyField:
    'freightCurrency' | 'insuranceCurrency' | 'commissionCurrency' | 'discountCurrency' | 'otherDeductionsCurrency'
}

export const invoiceCharges: ChargeDefinition[] = [
  { label: 'Freight', rateField: 'freightRate', amountField: 'freightAmount', currencyField: 'freightCurrency' },
  {
    label: 'Insurance',
    rateField: 'insuranceRate',
    amountField: 'insuranceAmount',
    currencyField: 'insuranceCurrency'
  },
  {
    label: 'Commission',
    rateField: 'commissionRate',
    amountField: 'commissionAmount',
    currencyField: 'commissionCurrency'
  },
  { label: 'Discount', rateField: 'discountRate', amountField: 'discountAmount', currencyField: 'discountCurrency' },
  {
    label: 'Other deductions',
    rateField: 'otherDeductionsRate',
    amountField: 'otherDeductionsAmount',
    currencyField: 'otherDeductionsCurrency'
  }
]

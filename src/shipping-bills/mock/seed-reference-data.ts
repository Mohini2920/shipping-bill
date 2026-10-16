// Reference data served by the mock reference service. Large code lists stay in src/data
// (sourced from ICEGATE and GST portals); the small lists below used to be hardcoded inside the
// form component. Only mock/ code imports this file.

import { documentCodes } from '@/data/e-sanchit-codes'
import { quantityCodes } from '@/data/quantity-code'
import schemeCodes from '@/data/scheme-codes'
import { stateOptions } from '@/data/states'
import { Trades } from '@/data/trade-agrements'
import { cargoOptions, contractTypes, paymentTypes, priceInclusionTypes, sealTypes, weightUnits } from '@/data/types'
import type { FormOptions, Option, Port } from '../domain/types'

export const loadingPorts: Port[] = [
  { code: 'INNSA1', name: 'Nhava Sheva', countryCode: 'IN' },
  { code: 'INMUN1', name: 'Mundra', countryCode: 'IN' },
  { code: 'INMAA1', name: 'Chennai', countryCode: 'IN' },
  { code: 'INBOM4', name: 'Mumbai Air Cargo', countryCode: 'IN' }
]

export const destinationPorts: Port[] = [
  { code: 'USMSY', name: 'New Orleans', countryCode: 'US' },
  { code: 'USLAX', name: 'Los Angeles', countryCode: 'US' },
  { code: 'DEHAM', name: 'Hamburg', countryCode: 'DE' },
  { code: 'AEJEA', name: 'Jebel Ali', countryCode: 'AE' },
  { code: 'SGSIN', name: 'Singapore', countryCode: 'SG' }
]

export function portLabel(port: Port) {
  return `${port.name} · ${port.code}`
}

/** Shipping marks the exporter has used before, keyed by exporter id. */
export const marksByExporter: Record<number, string[]> = {
  1000: ['AARAV TEXTILES / MADE IN INDIA', 'ATPL / LOT NO. ______'],
  1002: ['BLUE HARBOR EXPORTS / INDIA', 'BHE / SHIPPING MARKS AS PER INVOICE']
}

export const documentTypes: Option[] = documentCodes

function toOptions(list: { value: string | number; label: string }[]): Option[] {
  return list.map((item) => ({ value: String(item.value), label: item.label.trim() }))
}

function pairs(list: [string, string][]): Option[] {
  return list.map(([value, label]) => ({ value, label }))
}

export const formOptions: FormOptions = {
  currencies: ['USD', 'EUR', 'INR', 'AED', 'GBP', 'SGD'].map((code) => ({ value: code, label: code })),
  contractTypes: toOptions(contractTypes),
  paymentTypes: toOptions(paymentTypes),
  priceInclusionTypes: toOptions(priceInclusionTypes),
  cargoTypes: toOptions(cargoOptions),
  weightUnits: toOptions(weightUnits),
  sealTypes: toOptions(sealTypes),
  containerSizes: pairs([
    ['20', '20 ft'],
    ['40', '40 ft'],
    ['45', '45 ft']
  ]),
  containerSealTypes: pairs([
    ['1', 'BTSL - Bottle Seal'],
    ['2', 'ESEAL - Electronic Seal'],
    ['3', 'RFID - Radio Frequency Identifier']
  ]),
  nfeiCategories: pairs([
    ['01', 'Free trade sample'],
    ['02', 'Diplomatic goods'],
    ['03', 'Warranty replacement'],
    ['07', 'Gift parcel'],
    ['08', 'Other']
  ]),
  states: toOptions(stateOptions),
  quantityUnits: toOptions(quantityCodes),
  schemes: schemeCodes.map((scheme) => ({
    value: scheme.value,
    label: scheme.label,
    hasExportIncentive: scheme.drawback || scheme.RODTEP || scheme.ROSCTL
  })),
  tradeAgreements: toOptions(Trades),
  igstPaymentStatuses: pairs([
    ['NA', 'Not applicable'],
    ['LUT', 'Under LUT / bond'],
    ['P', 'Against payment']
  ]),
  accessoryStatuses: pairs([
    ['0', 'No accessory'],
    ['1', 'Included free of cost'],
    ['2', 'Entered separately']
  ]),
  goodsSources: pairs([
    ['I', 'Imported'],
    ['D', 'Indigenous']
  ]),
  fileTypes: pairs([['pdf', 'PDF']]),
  countries: pairs([
    ['IN', 'India'],
    ['US', 'United States'],
    ['DE', 'Germany'],
    ['AE', 'United Arab Emirates'],
    ['SG', 'Singapore'],
    ['GB', 'United Kingdom']
  ]),
  exporterClasses: pairs([
    ['F', 'Manufacturer'],
    ['R', 'Merchant'],
    ['C', 'Merchant courier'],
    ['D', 'Manufacturer courier']
  ]),
  exporterTypes: pairs([
    ['P', 'Private'],
    ['G', 'Government'],
    ['W', 'Warehouse']
  ]),
  destinationPorts: destinationPorts.map((port) => ({ value: port.code, label: portLabel(port) }))
}

// Shapes shared by the UI, the services and the mock backend. No React and no I/O in here.

/** A generic dropdown option. Values are strings because form fields hold strings. */
export interface Option {
  value: string
  label: string
  sublabel?: string
}

export interface SchemeOption extends Option {
  /** Drawback, RoDTEP or RoSCTL can be claimed under this scheme, so drawback fields apply. */
  hasExportIncentive: boolean
}

// ---------- Parties ----------

export type PartyKind = 'exporter' | 'business'

/** The roles a business can play on a shipping bill. */
export type BusinessRole = 'consignee' | 'buyer' | 'thirdParty'

export interface Branch {
  id: number
  branchName: string
  address1: string
  address2?: string
  city: string
  state?: string
  pincode?: string
  countryCode: string
  email?: string
  mobile?: string
  gstnId?: string
  adCode?: string
  accountNo?: string
  ifscCode?: string
}

export interface Exporter {
  id: number
  name: string
  iec: string
  class: string
  type: string
  pan?: string
  tan?: string
  aeoNumber?: string
  website?: string
  notes?: string
  disabled?: boolean
  branches: Branch[]
}

export interface Business {
  id: number
  name: string
  iec?: string
  isConsignee: boolean
  isBuyer: boolean
  isNotify: boolean
  isThirdParty: boolean
  branches: Branch[]
}

export type Party = Exporter | Business

export type BranchInput = Omit<Branch, 'id'>

export interface PartyInput {
  name: string
  iec?: string
  // Exporter only
  class?: string
  type?: string
  pan?: string
  tan?: string
  aeoNumber?: string
  website?: string
  notes?: string
  // Business only
  isConsignee?: boolean
  isBuyer?: boolean
  isNotify?: boolean
  isThirdParty?: boolean
  /** A new party is created together with its first branch so it is immediately usable on a bill. */
  firstBranch: BranchInput
}

export interface Port {
  code: string
  name: string
  countryCode: string
}

// ---------- Shipping bill form ----------
// Every editable value is a string, because HTML inputs produce strings. Conversion to numbers
// happens once, at the API boundary (see api/http/bill-mapper.ts).

export interface BillItemForm {
  ritcCode: string
  schemeCode?: string
  goodsDescription1: string
  quantity: string
  unitOfMeasurement: string
  unitPrice: string
  /** Optional manual override; when empty the total is quantity x unit price. */
  lineTotal?: string
  igstPaymentStatus?: string
  taxableValue?: string
  igstAmount?: string
  drawbackSerialNumber?: string
  drawbackUnit?: string
  drawbackQuantity?: string
  rewardItem?: boolean
  thirdPartyItem?: boolean
  itemThirdPartyId?: string
  itemThirdPartyBranchId?: string
  unitOfRate?: string
  numberOfUnits?: string
  presentMarketValue?: string
  cess?: string
  accessoriesDescription?: string
  accessoryStatus?: string
  originDistrictCode?: string
  tradeAgreementsCode?: string
  endUseOfItem?: string
  totalPackage?: string
  ar4Number?: string
  ar4Date?: string
}

export interface BillInvoiceForm {
  invoiceNumber: string
  invoiceDate: string
  currency: string
  /** Optional declared total; when empty the sum of item totals is used. */
  invoiceTotal?: string
  contractType: string
  buyerSameAsConsignee: boolean
  buyerId: string
  buyerBranchId: string
  thirdPartyId?: string
  thirdPartyBranchId?: string
  freightRate?: string
  freightAmount?: string
  freightCurrency?: string
  insuranceRate?: string
  insuranceAmount?: string
  insuranceCurrency?: string
  commissionRate?: string
  commissionAmount?: string
  commissionCurrency?: string
  discountRate?: string
  discountAmount?: string
  discountCurrency?: string
  otherDeductionsRate?: string
  otherDeductionsAmount?: string
  otherDeductionsCurrency?: string
  packingCharges?: string
  freightInsuranceIncluded?: string
  contractNumber?: string
  natureOfPayment?: string
  periodOfPayment?: string
  items: BillItemForm[]
}

export interface ContainerForm {
  containerNumber: string
  containerSize?: string
  exciseSealNumber?: string
  sealDate?: string
  sealType?: string
  sealDeviceId?: string
  movementDocumentType?: string
  movementDocumentNumber?: string
}

export interface PackingRangeForm {
  packingNumberFrom: string
  packingNumberTo: string
  packingCode?: string
}

export interface SupportingDocForm {
  documentTypeCode: string
  documentReferenceNumber: string
  imageReferenceNumber?: string
  documentIssueDate?: string
  documentExpiryDate?: string
  invoiceSerialNumber?: string
  itemSerialNumber?: string
  fileType?: string
  placeOfIssue?: string
  issuingPartyCode?: string
  issuingPartyName?: string
  issuingPartyAddress1?: string
  issuingPartyAddress2?: string
  issuingPartyCity?: string
  issuingPartyPin?: string
  beneficiaryPartyCode?: string
  beneficiaryPartyName?: string
  beneficiaryPartyAddress1?: string
  beneficiaryPartyAddress2?: string
  beneficiaryPartyCity?: string
  beneficiaryPartyPin?: string
}

export interface LicenseForm {
  registrationNumber: string
  registrationDate?: string
  invoiceSerialNumber?: string
  itemSerialNumber?: string
  licenseSerialNumber?: string
  itemSerialNumberPartE?: string
  itemSerialNumberPartC?: string
  licenseQuantity?: string
  licenseExportQuantity?: string
  indigenousOrImported?: string
}

export interface ShippingBillFormValues {
  /** Assigned by the backend when a bill is first saved. */
  jobNumber?: string
  jobDate: string
  exporterId: string
  exporterBranchId: string
  consigneeId: string
  consigneeBranchId: string
  loadingPort: string
  finalDestinationPort: string
  dischargePort?: string
  originStateCode?: string
  nfeiCategory?: string
  rbiWaiverNumber?: string
  rbiWaiverDate?: string
  sealType?: string
  numberOfContainers?: string
  natureOfCargo: string
  grossWeight?: string
  netWeight?: string
  measurementUnit: string
  totalPackages?: string
  marksAndNumbers?: string
  loosePackets?: string
  mawbNumber?: string
  hawbNumber?: string
  invoices: BillInvoiceForm[]
  containers: ContainerForm[]
  packingRanges: PackingRangeForm[]
  documents: SupportingDocForm[]
  licenses: LicenseForm[]
}

// ---------- Service results ----------

export interface SavedBill {
  id: number
  created: string
  updated: string
  values: ShippingBillFormValues
}

/** One row of the shipping bill list. A list endpoint returns summaries, not full bills. */
export interface ShippingBillSummary {
  id: number
  jobNumber?: string
  jobDate: string
  exporterName?: string
  consigneeName?: string
  loadingPort: string
  finalDestinationPort: string
  invoiceNumbers: string[]
  /** Sum of invoice totals. Undefined when the source does not provide it. */
  totalValue?: number
  updated: string
}

export interface FlatFile {
  filename: string
  content: string
}

/** Small, mostly static option lists that the form needs. Loaded once per page. */
export interface FormOptions {
  currencies: Option[]
  contractTypes: Option[]
  paymentTypes: Option[]
  priceInclusionTypes: Option[]
  cargoTypes: Option[]
  weightUnits: Option[]
  sealTypes: Option[]
  containerSizes: Option[]
  containerSealTypes: Option[]
  nfeiCategories: Option[]
  states: Option[]
  quantityUnits: Option[]
  schemes: SchemeOption[]
  tradeAgreements: Option[]
  igstPaymentStatuses: Option[]
  accessoryStatuses: Option[]
  goodsSources: Option[]
  fileTypes: Option[]
  countries: Option[]
  exporterClasses: Option[]
  exporterTypes: Option[]
  /** Destination ports for the optional discharge port select. Loading ports are searched instead. */
  destinationPorts: Option[]
}

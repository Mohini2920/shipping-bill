// Complete, internally consistent sample bills. Every party, branch and port referenced here exists
// in the seed data, so each bill opens in the editor with all fields resolved.

import { emptyBill, emptyItem } from '../domain/defaults'
import type { BillInvoiceForm, SavedBill } from '../domain/types'

function invoice(values: Partial<BillInvoiceForm> & Pick<BillInvoiceForm, 'items'>): BillInvoiceForm {
  return {
    invoiceNumber: '',
    invoiceDate: '2026-09-17',
    currency: 'USD',
    contractType: 'FOB',
    buyerSameAsConsignee: true,
    buyerId: '',
    buyerBranchId: '',
    ...values
  }
}

export const seedBills: SavedBill[] = [
  {
    id: 3000,
    created: '2026-09-18T08:00:00.000Z',
    updated: '2026-09-18T08:00:00.000Z',
    values: {
      ...emptyBill(),
      jobNumber: '2081',
      jobDate: '2026-09-18',
      exporterId: '1000',
      exporterBranchId: '1001',
      consigneeId: '2002',
      consigneeBranchId: '2003',
      loadingPort: 'INMUN1',
      finalDestinationPort: 'USMSY',
      grossWeight: '34.6',
      netWeight: '23.5',
      totalPackages: '12',
      invoices: [
        invoice({
          invoiceNumber: 'EX/2081/2026',
          items: [
            {
              ...emptyItem(),
              ritcCode: '61091000',
              goodsDescription1: 'Cotton T-shirts',
              quantity: '51',
              unitPrice: '3.831',
              igstPaymentStatus: 'LUT',
              rewardItem: true
            }
          ]
        })
      ]
    }
  },
  {
    id: 3001,
    created: '2026-09-22T10:30:00.000Z',
    updated: '2026-09-23T06:15:00.000Z',
    values: {
      ...emptyBill(),
      jobNumber: '2082',
      jobDate: '2026-09-22',
      exporterId: '1002',
      exporterBranchId: '1005',
      consigneeId: '1000',
      consigneeBranchId: '1000',
      loadingPort: 'INMUN1',
      finalDestinationPort: 'AEJEA',
      natureOfCargo: 'C',
      grossWeight: '18450',
      netWeight: '17900',
      totalPackages: '640',
      marksAndNumbers: 'BLUE HARBOR EXPORTS / INDIA',
      invoices: [
        invoice({
          invoiceNumber: 'BHE/114/2026',
          invoiceDate: '2026-09-21',
          contractType: 'CIF',
          freightAmount: '1450',
          insuranceRate: '0.5',
          items: [
            {
              ...emptyItem(),
              ritcCode: '10063020',
              goodsDescription1: 'Basmati rice, 25 kg bags',
              quantity: '640',
              unitOfMeasurement: 'BAG',
              unitPrice: '31.5',
              igstPaymentStatus: 'LUT'
            }
          ]
        })
      ],
      containers: [{ containerNumber: 'MSCU1234567', containerSize: '20', sealType: '2' }],
      documents: [
        {
          documentTypeCode: '861000',
          documentReferenceNumber: 'COO/2026/0918',
          documentIssueDate: '2026-09-20'
        }
      ]
    }
  },
  {
    id: 3002,
    created: '2026-10-02T09:00:00.000Z',
    updated: '2026-10-05T12:40:00.000Z',
    values: {
      ...emptyBill(),
      jobNumber: '2083',
      jobDate: '2026-10-02',
      exporterId: '1010',
      exporterBranchId: '1011',
      consigneeId: '2010',
      consigneeBranchId: '2011',
      loadingPort: 'INNSA1',
      finalDestinationPort: 'DEHAM',
      grossWeight: '2200',
      netWeight: '2050',
      totalPackages: '110',
      invoices: [
        invoice({
          invoiceNumber: 'AGF/EU/0091',
          invoiceDate: '2026-10-01',
          currency: 'EUR',
          items: [
            {
              ...emptyItem(),
              ritcCode: '62034200',
              goodsDescription1: "Men's cotton trousers",
              quantity: '1200',
              unitPrice: '8.75'
            },
            {
              ...emptyItem(),
              ritcCode: '62046200',
              goodsDescription1: "Women's cotton trousers",
              quantity: '900',
              unitPrice: '9.2'
            }
          ]
        }),
        invoice({
          invoiceNumber: 'AGF/EU/0092',
          invoiceDate: '2026-10-01',
          currency: 'EUR',
          items: [
            {
              ...emptyItem(),
              ritcCode: '61051000',
              goodsDescription1: "Men's cotton knitted shirts",
              quantity: '600',
              unitPrice: '6.4'
            }
          ]
        })
      ],
      packingRanges: [{ packingNumberFrom: '1', packingNumberTo: '110', packingCode: 'CTN' }]
    }
  },
  {
    id: 3003,
    created: '2026-10-09T07:20:00.000Z',
    updated: '2026-10-09T07:20:00.000Z',
    values: {
      ...emptyBill(),
      jobNumber: '2084',
      jobDate: '2026-10-09',
      exporterId: '1020',
      exporterBranchId: '1021',
      consigneeId: '2040',
      consigneeBranchId: '2041',
      loadingPort: 'INMAA1',
      finalDestinationPort: 'SGSIN',
      grossWeight: '5200',
      netWeight: '5000',
      totalPackages: '200',
      invoices: [
        invoice({
          invoiceNumber: 'ZSA/SG/0412',
          invoiceDate: '2026-10-08',
          items: [
            {
              ...emptyItem(),
              ritcCode: '09042211',
              schemeCode: '19',
              goodsDescription1: 'Dried red chilli powder',
              quantity: '5000',
              unitOfMeasurement: 'KGS',
              unitPrice: '2.9',
              drawbackSerialNumber: '090401',
              drawbackQuantity: '5000'
            }
          ]
        })
      ]
    }
  }
]

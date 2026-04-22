export interface PDFFieldMapping {
  pdfFieldName: string
  formFieldKey: string
  page: number
  required?: boolean
  isSignature?: boolean
}

export const PAGE_1_FIELDS: PDFFieldMapping[] = [
  { pdfFieldName: 'company_name', formFieldKey: 'company_name', page: 1, required: true },
  { pdfFieldName: 'vat_number', formFieldKey: 'vat_number', page: 1, required: true },
  { pdfFieldName: 'address', formFieldKey: 'full_address', page: 1, required: true },
  { pdfFieldName: 'mobile_number', formFieldKey: 'mobile_number', page: 1, required: true },
  { pdfFieldName: 'contact_person', formFieldKey: 'contact_person', page: 1, required: true },
]

export const PAGE_3_FIELDS: PDFFieldMapping[] = [
  { pdfFieldName: 'retailer_signature', formFieldKey: 'retailer_signature', page: 3, isSignature: true },
  { pdfFieldName: 'staff_signature', formFieldKey: 'staff_signature', page: 3, isSignature: true },
  { pdfFieldName: 'date', formFieldKey: 'contract_date', page: 3 },
]

export const PAGE_4_FIELDS: PDFFieldMapping[] = [
  { pdfFieldName: 'company_name_p4', formFieldKey: 'company_name', page: 4 },
  { pdfFieldName: 'vat_number_p4', formFieldKey: 'vat_number', page: 4 },
  { pdfFieldName: 'address_p4', formFieldKey: 'full_address', page: 4 },
  { pdfFieldName: 'retailer_signature_p4', formFieldKey: 'retailer_signature', page: 4, isSignature: true },
]

export const PAGE_5_FIELDS: PDFFieldMapping[] = [
  { pdfFieldName: 'date_p5', formFieldKey: 'contract_date', page: 5 },
  { pdfFieldName: 'shop_name', formFieldKey: 'company_name', page: 5 },
  { pdfFieldName: 'shop_address', formFieldKey: 'full_address', page: 5 },
]

export const PAGE_7_FIELDS: PDFFieldMapping[] = [
  { pdfFieldName: 'retailer_signature_p7', formFieldKey: 'retailer_signature', page: 7, isSignature: true },
  { pdfFieldName: 'retailer_name_p7', formFieldKey: 'contact_person', page: 7 },
  { pdfFieldName: 'date_p7', formFieldKey: 'contract_date', page: 7 },
]

export const ALL_PDF_FIELDS = [
  ...PAGE_1_FIELDS,
  ...PAGE_3_FIELDS,
  ...PAGE_4_FIELDS,
  ...PAGE_5_FIELDS,
  ...PAGE_7_FIELDS,
]
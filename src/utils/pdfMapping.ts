export interface PDFFieldMapping {
  key: string
  page: number
  x: number
  y: number
  width?: number
  height?: number
  fontSize?: number
}

export const PAGE_1_FIELDS: PDFFieldMapping[] = [
  { key: 'company_name', page: 1, x: 120, y: 680, width: 200, height: 20, fontSize: 10 },
  { key: 'vat_number', page: 1, x: 120, y: 660, width: 200, height: 20, fontSize: 10 },
  { key: 'address', page: 1, x: 120, y: 640, width: 250, height: 20, fontSize: 10 },
  { key: 'mobile_number', page: 1, x: 120, y: 620, width: 150, height: 20, fontSize: 10 },
  { key: 'contact_person', page: 1, x: 120, y: 600, width: 150, height: 20, fontSize: 10 },
]

export const PAGE_3_FIELDS: PDFFieldMapping[] = [
  { key: 'retailer_signature', page: 3, x: 50, y: 350, width: 200, height: 60 },
  { key: 'staff_signature', page: 3, x: 300, y: 350, width: 200, height: 60 },
  { key: 'date_p3', page: 3, x: 400, y: 450, width: 100, height: 20, fontSize: 10 },
]

export const PAGE_4_FIELDS: PDFFieldMapping[] = [
  { key: 'company_name_p4', page: 4, x: 100, y: 580, width: 200, height: 20, fontSize: 10 },
  { key: 'vat_number_p4', page: 4, x: 100, y: 560, width: 200, height: 20, fontSize: 10 },
  { key: 'address_p4', page: 4, x: 100, y: 540, width: 250, height: 20, fontSize: 10 },
  { key: 'retailer_signature_p4', page: 4, x: 50, y: 300, width: 200, height: 60 },
]

export const PAGE_5_FIELDS: PDFFieldMapping[] = [
  { key: 'date_p5', page: 5, x: 100, y: 650, width: 100, height: 20, fontSize: 10 },
  { key: 'shop_name', page: 5, x: 100, y: 620, width: 200, height: 20, fontSize: 10 },
  { key: 'shop_address', page: 5, x: 100, y: 600, width: 250, height: 20, fontSize: 10 },
]

export const PAGE_7_FIELDS: PDFFieldMapping[] = [
  { key: 'date_p7', page: 7, x: 100, y: 480, width: 100, height: 20, fontSize: 10 },
  { key: 'retailer_name_p7', page: 7, x: 100, y: 440, width: 150, height: 20, fontSize: 10 },
  { key: 'retailer_signature_p7', page: 7, x: 50, y: 320, width: 200, height: 60 },
]

export const ALL_PDF_FIELDS = [
  ...PAGE_1_FIELDS,
  ...PAGE_3_FIELDS,
  ...PAGE_4_FIELDS,
  ...PAGE_5_FIELDS,
  ...PAGE_7_FIELDS,
]

export function mapFormDataToPDF(formData: {
  company_name: string
  vat_number: string
  address_lane: string
  house_number: string
  city: string
  postcode: string
  contact_person_name: string
  contact_person_surname: string
  mobile_number: string
  contract_date?: string
}): Record<string, string> {
  return {
    company_name: formData.company_name,
    vat_number: formData.vat_number,
    address: `${formData.address_lane} ${formData.house_number}, ${formData.postcode} ${formData.city}`,
    mobile_number: formData.mobile_number,
    contact_person: `${formData.contact_person_name} ${formData.contact_person_surname}`,
    company_name_p4: formData.company_name,
    vat_number_p4: formData.vat_number,
    address_p4: `${formData.address_lane} ${formData.house_number}, ${formData.postcode} ${formData.city}`,
    shop_name: formData.company_name,
    shop_address: `${formData.address_lane} ${formData.house_number}, ${formData.postcode} ${formData.city}`,
    retailer_name_p7: `${formData.contact_person_name} ${formData.contact_person_surname}`,
    date_p3: formData.contract_date || new Date().toLocaleDateString('it-IT'),
    date_p5: formData.contract_date || new Date().toLocaleDateString('it-IT'),
    date_p7: formData.contract_date || new Date().toLocaleDateString('it-IT'),
  }
}
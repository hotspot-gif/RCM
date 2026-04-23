import { PDFDocument, rgb, StandardFonts, PDFName, PDFDict } from 'pdf-lib'
import { format } from 'date-fns'

export interface ContractFormData {
  company_name: string
  vat_number: string
  address_lane: string
  house_number: string
  city: string
  postcode: string
  contact_person_name: string
  contact_person_surname: string
  mobile_number: string
  landline_number: string
  email: string
  branch: string
  zone: string
  retailer_email: string
  staff_email: string
  contract_date?: string
}

export interface GeneratePDFResult {
  success: boolean
  pdfBytes?: Uint8Array
  error?: string
}

export interface FieldPosition {
  page: number
  x: number
  y: number
  width?: number
  height?: number
  fontSize?: number
}

export interface PDFTemplateConfig {
  fields: Record<string, FieldPosition>
}

export const DEFAULT_TEMPLATE_CONFIG: PDFTemplateConfig = {
  fields: {
    company_name: { page: 1, x: 120, y: 680, width: 200, height: 20, fontSize: 10 },
    vat_number: { page: 1, x: 120, y: 660, width: 200, height: 20, fontSize: 10 },
    address: { page: 1, x: 120, y: 640, width: 250, height: 20, fontSize: 10 },
    mobile_number: { page: 1, x: 120, y: 620, width: 150, height: 20, fontSize: 10 },
    contact_person: { page: 1, x: 120, y: 600, width: 150, height: 20, fontSize: 10 },
    
    retailer_signature: { page: 3, x: 50, y: 350, width: 200, height: 60 },
    staff_signature: { page: 3, x: 300, y: 350, width: 200, height: 60 },
    date_p3: { page: 3, x: 400, y: 450, width: 100, height: 20, fontSize: 10 },
    
    company_name_p4: { page: 4, x: 100, y: 580, width: 200, height: 20, fontSize: 10 },
    vat_number_p4: { page: 4, x: 100, y: 560, width: 200, height: 20, fontSize: 10 },
    address_p4: { page: 4, x: 100, y: 540, width: 250, height: 20, fontSize: 10 },
    retailer_signature_p4: { page: 4, x: 50, y: 300, width: 200, height: 60 },
    
    date_p5: { page: 5, x: 100, y: 650, width: 100, height: 20, fontSize: 10 },
    shop_name: { page: 5, x: 100, y: 620, width: 200, height: 20, fontSize: 10 },
    shop_address: { page: 5, x: 100, y: 600, width: 250, height: 20, fontSize: 10 },
    
    date_p7: { page: 7, x: 100, y: 480, width: 100, height: 20, fontSize: 10 },
    retailer_name_p7: { page: 7, x: 100, y: 440, width: 150, height: 20, fontSize: 10 },
    retailer_signature_p7: { page: 7, x: 50, y: 320, width: 200, height: 60 },
  }
}

async function loadTemplate(): Promise<PDFDocument> {
  const response = await fetch('/contract.pdf')
  if (!response.ok) {
    throw new Error('Failed to load PDF template')
  }
  const arrayBuffer = await response.arrayBuffer()
  return PDFDocument.load(arrayBuffer)
}

function getFullAddress(data: ContractFormData): string {
  return `${data.address_lane} ${data.house_number}, ${data.postcode} ${data.city}`
}

function getContactPerson(data: ContractFormData): string {
  return `${data.contact_person_name} ${data.contact_person_surname}`
}

export async function generateContractPDF(
  formData: ContractFormData,
  retailerSignature: string | null,
  staffSignature: string | null,
  contractNumber: string,
  config: PDFTemplateConfig = DEFAULT_TEMPLATE_CONFIG
): Promise<GeneratePDFResult> {
  try {
    const pdfDoc = await loadTemplate()
    const pages = pdfDoc.getPages()
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const contractDate = formData.contract_date || format(new Date(), 'yyyy-MM-dd')
    const formattedDate = format(new Date(contractDate), 'dd/MM/yyyy')

    const fullAddress = getFullAddress(formData)
    const contactPerson = getContactPerson(formData)

    const getFieldConfig = (key: string): FieldPosition | undefined => {
      return config.fields[key]
    }

    const drawTextOnPage = (
      page: ReturnType<PDFDocument['getPages']>[number],
      text: string,
      x: number,
      y: number,
      fontSize: number = 10
    ) => {
      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      })
    }

    const drawImageOnPage = async (
      page: ReturnType<PDFDocument['getPages']>[number],
      imageDataUrl: string,
      x: number,
      y: number,
      width: number,
      height: number
    ) => {
      try {
        if (imageDataUrl.startsWith('data:')) {
          const base64 = imageDataUrl.split(',')[1]
          const binaryString = atob(base64)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          const img = await pdfDoc.embedPng(bytes)
          page.drawImage(img, { x, y, width, height })
        } else {
          const response = await fetch(imageDataUrl)
          const arrayBuffer = await response.arrayBuffer()
          const img = await pdfDoc.embedPng(arrayBuffer)
          page.drawImage(img, { x, y, width, height })
        }
      } catch (e) {
        console.error('Failed to embed image:', e)
      }
    }

    // Page 1: Company Details
    const page1 = pages[0]
    if (page1) {
      const companyNameConfig = getFieldConfig('company_name')
      if (companyNameConfig) {
        drawTextOnPage(page1, formData.company_name, companyNameConfig.x, companyNameConfig.y, companyNameConfig.fontSize || 10)
      }

      const vatConfig = getFieldConfig('vat_number')
      if (vatConfig) {
        drawTextOnPage(page1, formData.vat_number, vatConfig.x, vatConfig.y, vatConfig.fontSize || 10)
      }

      const addressConfig = getFieldConfig('address')
      if (addressConfig) {
        drawTextOnPage(page1, fullAddress, addressConfig.x, addressConfig.y, addressConfig.fontSize || 10)
      }

      const mobileConfig = getFieldConfig('mobile_number')
      if (mobileConfig) {
        drawTextOnPage(page1, formData.mobile_number, mobileConfig.x, mobileConfig.y, mobileConfig.fontSize || 10)
      }

      const contactConfig = getFieldConfig('contact_person')
      if (contactConfig) {
        drawTextOnPage(page1, contactPerson, contactConfig.x, contactConfig.y, contactConfig.fontSize || 10)
      }
    }

    // Page 3: Signatures and Date
    const page3 = pages[2]
    if (page3) {
      const dateConfig = getFieldConfig('date_p3')
      if (dateConfig) {
        drawTextOnPage(page3, formattedDate, dateConfig.x, dateConfig.y, dateConfig.fontSize || 10)
      }

      const retailerSigConfig = getFieldConfig('retailer_signature')
      if (retailerSignature && retailerSigConfig) {
        await drawImageOnPage(
          page3,
          retailerSignature,
          retailerSigConfig.x,
          retailerSigConfig.y,
          retailerSigConfig.width || 200,
          retailerSigConfig.height || 60
        )
      }

      const staffSigConfig = getFieldConfig('staff_signature')
      if (staffSignature && staffSigConfig) {
        await drawImageOnPage(
          page3,
          staffSignature,
          staffSigConfig.x,
          staffSigConfig.y,
          staffSigConfig.width || 200,
          staffSigConfig.height || 60
        )
      }
    }

    // Page 4: Retailer details repeat with signature
    const page4 = pages[3]
    if (page4) {
      const p4CompanyConfig = getFieldConfig('company_name_p4')
      if (p4CompanyConfig) {
        drawTextOnPage(page4, formData.company_name, p4CompanyConfig.x, p4CompanyConfig.y, p4CompanyConfig.fontSize || 10)
      }

      const p4VatConfig = getFieldConfig('vat_number_p4')
      if (p4VatConfig) {
        drawTextOnPage(page4, formData.vat_number, p4VatConfig.x, p4VatConfig.y, p4VatConfig.fontSize || 10)
      }

      const p4AddressConfig = getFieldConfig('address_p4')
      if (p4AddressConfig) {
        drawTextOnPage(page4, fullAddress, p4AddressConfig.x, p4AddressConfig.y, p4AddressConfig.fontSize || 10)
      }

      const p4SigConfig = getFieldConfig('retailer_signature_p4')
      if (retailerSignature && p4SigConfig) {
        await drawImageOnPage(
          page4,
          retailerSignature,
          p4SigConfig.x,
          p4SigConfig.y,
          p4SigConfig.width || 200,
          p4SigConfig.height || 60
        )
      }
    }

    // Page 5: Shop details
    const page5 = pages[4]
    if (page5) {
      const p5DateConfig = getFieldConfig('date_p5')
      if (p5DateConfig) {
        drawTextOnPage(page5, formattedDate, p5DateConfig.x, p5DateConfig.y, p5DateConfig.fontSize || 10)
      }

      const p5ShopNameConfig = getFieldConfig('shop_name')
      if (p5ShopNameConfig) {
        drawTextOnPage(page5, formData.company_name, p5ShopNameConfig.x, p5ShopNameConfig.y, p5ShopNameConfig.fontSize || 10)
      }

      const p5AddressConfig = getFieldConfig('shop_address')
      if (p5AddressConfig) {
        drawTextOnPage(page5, fullAddress, p5AddressConfig.x, p5AddressConfig.y, p5AddressConfig.fontSize || 10)
      }
    }

    // Page 7: Final signature page
    const page7 = pages[6]
    if (page7) {
      const p7DateConfig = getFieldConfig('date_p7')
      if (p7DateConfig) {
        drawTextOnPage(page7, formattedDate, p7DateConfig.x, p7DateConfig.y, p7DateConfig.fontSize || 10)
      }

      const p7NameConfig = getFieldConfig('retailer_name_p7')
      if (p7NameConfig) {
        drawTextOnPage(page7, contactPerson, p7NameConfig.x, p7NameConfig.y, p7NameConfig.fontSize || 10)
      }

      const p7SigConfig = getFieldConfig('retailer_signature_p7')
      if (retailerSignature && p7SigConfig) {
        await drawImageOnPage(
          page7,
          retailerSignature,
          p7SigConfig.x,
          p7SigConfig.y,
          p7SigConfig.width || 200,
          p7SigConfig.height || 60
        )
      }
    }

    // Add contract number to each page footer
    pages.forEach((page) => {
      const { height } = page.getSize()
      page.drawText(`Contract: ${contractNumber}`, {
        x: 50,
        y: 20,
        size: 8,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
      })
    })

    const pdfBytes = await pdfDoc.save()
    return { success: true, pdfBytes }
  } catch (error) {
    console.error('PDF generation error:', error)
    return { success: false, error: String(error) }
  }
}

export function downloadPDF(pdfBytes: Uint8Array, filename: string): void {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export function createCustomConfig(customPositions: Partial<PDFTemplateConfig['fields']>): PDFTemplateConfig {
  return {
    fields: { ...DEFAULT_TEMPLATE_CONFIG.fields, ...customPositions }
  }
}
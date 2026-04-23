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

// Positions as percentages of page dimensions (more adaptable)
export const DEFAULT_TEMPLATE_CONFIG: PDFTemplateConfig = {
  fields: {
    company_name: { page: 1, x: 150, y: 720, width: 200, height: 20, fontSize: 10 },
    vat_number: { page: 1, x: 150, y: 700, width: 200, height: 20, fontSize: 10 },
    address: { page: 1, x: 150, y: 680, width: 250, height: 20, fontSize: 10 },
    mobile_number: { page: 1, x: 150, y: 660, width: 150, height: 20, fontSize: 10 },
    contact_person: { page: 1, x: 150, y: 640, width: 150, height: 20, fontSize: 10 },
    
    retailer_signature: { page: 3, x: 80, y: 380, width: 180, height: 50 },
    staff_signature: { page: 3, x: 320, y: 380, width: 180, height: 50 },
    date_p3: { page: 3, x: 400, y: 450, width: 100, height: 20, fontSize: 10 },
    
    company_name_p4: { page: 4, x: 100, y: 550, width: 200, height: 20, fontSize: 10 },
    vat_number_p4: { page: 4, x: 100, y: 530, width: 200, height: 20, fontSize: 10 },
    address_p4: { page: 4, x: 100, y: 510, width: 250, height: 20, fontSize: 10 },
    retailer_signature_p4: { page: 4, x: 80, y: 380, width: 180, height: 50 },
    
    date_p5: { page: 5, x: 100, y: 650, width: 100, height: 20, fontSize: 10 },
    shop_name: { page: 5, x: 100, y: 620, width: 200, height: 20, fontSize: 10 },
    shop_address: { page: 5, x: 100, y: 600, width: 250, height: 20, fontSize: 10 },
    
    date_p7: { page: 7, x: 100, y: 480, width: 100, height: 20, fontSize: 10 },
    retailer_name_p7: { page: 7, x: 100, y: 440, width: 150, height: 20, fontSize: 10 },
    retailer_signature_p7: { page: 7, x: 80, y: 350, width: 180, height: 50 },
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
    const form = pdfDoc.getForm()
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)

    // Log PDF info for calibration
    console.log('Generating PDF with', pages.length, 'pages')
    if (pages.length >= 7) {
      const p1 = pages[0]
      const { width: w1, height: h1 } = p1.getSize()
      console.log(`Page 1 size: ${w1.toFixed(0)}x${h1.toFixed(0)} pts`)
    }

    const contractDate = formData.contract_date || format(new Date(), 'yyyy-MM-dd')
    const formattedDate = format(new Date(contractDate), 'dd/MM/yyyy')

    const fullAddress = getFullAddress(formData)
    const contactPerson = getContactPerson(formData)

    const drawTextOnPage = (
      page: ReturnType<PDFDocument['getPages']>[number],
      text: string,
      x: number,
      y: number,
      fontSize: number = 10,
      maxWidth?: number
    ) => {
      if (maxWidth) {
        const words = text.split(' ')
        let currentLine = ''
        let currentY = y
        words.forEach((word) => {
          const testLine = currentLine + (currentLine ? ' ' : '') + word
          const metrics = helveticaFont.widthOfTextAtSize(testLine, fontSize)
          if (metrics > maxWidth && currentLine) {
            page.drawText(currentLine, { x, y: currentY, size: fontSize, font: helveticaFont, color: rgb(0, 0, 0) })
            currentY -= fontSize + 2
            currentLine = word
          } else {
            currentLine = testLine
          }
        })
        page.drawText(currentLine, { x, y: currentY, size: fontSize, font: helveticaFont, color: rgb(0, 0, 0) })
      } else {
        page.drawText(text, { x, y, size: fontSize, font: helveticaFont, color: rgb(0, 0, 0) })
      }
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
        let img
        if (imageDataUrl.startsWith('data:')) {
          const base64 = imageDataUrl.split(',')[1]
          const binaryString = atob(base64)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          img = await pdfDoc.embedPng(bytes)
        } else {
          const response = await fetch(imageDataUrl)
          const arrayBuffer = await response.arrayBuffer()
          img = await pdfDoc.embedPng(arrayBuffer)
        }
        page.drawImage(img, { x, y, width, height })
      } catch (e) {
        console.error('Failed to embed image:', e)
      }
    }

    // Helper to try filling a form field, return true if successful
    const tryFillFormField = (fieldNames: string[], value: string): boolean => {
      for (const name of fieldNames) {
        try {
          const field = form.getTextField(name)
          if (field) {
            field.setText(value)
            return true
          }
        } catch {
          continue
        }
      }
      return false
    }

    const drawTextOnPage = (
      page: ReturnType<PDFDocument['getPages']>[number],
      text: string,
      x: number,
      y: number,
      fontSize: number = 10,
      maxWidth?: number
    ) => {
      const lines = text.split('\n')
      let currentY = y
      lines.forEach((line) => {
        if (maxWidth) {
          // Simple word wrap
          const words = line.split(' ')
          let currentLine = ''
          words.forEach((word) => {
            const testLine = currentLine + (currentLine ? ' ' : '') + word
            const metrics = helveticaFont.widthOfTextAtSize(testLine, fontSize)
            if (metrics > maxWidth && currentLine) {
              page.drawText(currentLine, { x, y: currentY, size: fontSize, font: helveticaFont, color: rgb(0, 0, 0) })
              currentY -= fontSize + 2
              currentLine = word
            } else {
              currentLine = testLine
            }
          })
          page.drawText(currentLine, { x, y: currentY, size: fontSize, font: helveticaFont, color: rgb(0, 0, 0) })
          currentY -= fontSize + 2
        } else {
          page.drawText(line, { x, y: currentY, size: fontSize, font: helveticaFont, color: rgb(0, 0, 0) })
          currentY -= fontSize + 2
        }
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
      const fieldMappings: Array<{ key: string; value: string }> = [
        { key: 'company_name', value: formData.company_name },
        { key: 'vat_number', value: formData.vat_number },
        { key: 'address', value: fullAddress },
        { key: 'mobile_number', value: formData.mobile_number },
        { key: 'contact_person', value: contactPerson },
      ]

      fieldMappings.forEach(({ key, value }) => {
        const config = getFieldConfig(key)
        if (config) {
          const candidateNames = [key, key.replace('_', ''), key.replace('_', ' ')]
          let filled = false
          for (const name of candidateNames) {
            try {
              const field = form.getTextField(name)
              if (field) {
                field.setText(value)
                filled = true
                break
              }
            } catch {}
          }
          if (!filled) {
            drawTextOnPage(page1, value, config.x, config.y, config.fontSize || 10, config.width)
          }
        }
      })
    }

    // Page 3: Signatures and Date
    const page3 = pages[2]
    if (page3) {
      const dateConfig = getFieldConfig('date_p3')
      if (dateConfig) {
        const dateFieldNames = ['date', 'date_p3', 'Date', 'Date_field']
        let filled = false
        for (const name of dateFieldNames) {
          try {
            const field = form.getTextField(name)
            if (field) {
              field.setText(formattedDate)
              filled = true
              break
            }
          } catch {}
        }
        if (!filled) drawTextOnPage(page3, formattedDate, dateConfig.x, dateConfig.y, dateConfig.fontSize || 10)
      }

      const retailerSigConfig = getFieldConfig('retailer_signature')
      if (retailerSignature && retailerSigConfig) {
        await drawImageOnPage(page3, retailerSignature, retailerSigConfig.x, retailerSigConfig.y, retailerSigConfig.width || 180, retailerSigConfig.height || 50)
      }

      const staffSigConfig = getFieldConfig('staff_signature')
      if (staffSignature && staffSigConfig) {
        await drawImageOnPage(page3, staffSignature, staffSigConfig.x, staffSigConfig.y, staffSigConfig.width || 180, staffSigConfig.height || 50)
      }
    }

    // Page 4: Retailer details repeat with signature
    const page4 = pages[3]
    if (page4) {
      const p4Mappings: Array<{ key: string; value: string }> = [
        { key: 'company_name_p4', value: formData.company_name },
        { key: 'vat_number_p4', value: formData.vat_number },
        { key: 'address_p4', value: fullAddress },
      ]

      p4Mappings.forEach(({ key, value }) => {
        const config = getFieldConfig(key)
        if (config) {
          const candidateNames = [key, key.replace('_p4', ''), key.replace('_', '')]
          let filled = false
          for (const name of candidateNames) {
            try {
              const field = form.getTextField(name)
              if (field) {
                field.setText(value)
                filled = true
                break
              }
            } catch {}
          }
          if (!filled) drawTextOnPage(page4, value, config.x, config.y, config.fontSize || 10, config.width)
        }
      })

      const p4SigConfig = getFieldConfig('retailer_signature_p4')
      if (retailerSignature && p4SigConfig) {
        await drawImageOnPage(page4, retailerSignature, p4SigConfig.x, p4SigConfig.y, p4SigConfig.width || 180, p4SigConfig.height || 50)
      }
    }

    // Page 5: Shop details
    const page5 = pages[4]
    if (page5) {
      const p5Mappings: Array<{ key: string; value: string }> = [
        { key: 'date_p5', value: formattedDate },
        { key: 'shop_name', value: formData.company_name },
        { key: 'shop_address', value: fullAddress },
      ]

      p5Mappings.forEach(({ key, value }) => {
        const config = getFieldConfig(key)
        if (config) {
          const candidateNames = [key, 'date', 'shop_name', 'shop_address', key.replace('_p5', '')]
          let filled = false
          for (const name of candidateNames) {
            try {
              const field = form.getTextField(name)
              if (field) {
                field.setText(value)
                filled = true
                break
              }
            } catch {}
          }
          if (!filled) drawTextOnPage(page5, value, config.x, config.y, config.fontSize || 10, config.width)
        }
      })
    }

    // Page 7: Final signature page
    const page7 = pages[6]
    if (page7) {
      const p7Mappings: Array<{ key: string; value: string }> = [
        { key: 'date_p7', value: formattedDate },
        { key: 'retailer_name_p7', value: contactPerson },
      ]

      p7Mappings.forEach(({ key, value }) => {
        const config = getFieldConfig(key)
        if (config) {
          const candidateNames = [key, 'date', 'retailer_name']
          let filled = false
          for (const name of candidateNames) {
            try {
              const field = form.getTextField(name)
              if (field) {
                field.setText(value)
                filled = true
                break
              }
            } catch {}
          }
          if (!filled) drawTextOnPage(page7, value, config.x, config.y, config.fontSize || 10, config.width)
        }
      })

      const p7SigConfig = getFieldConfig('retailer_signature_p7')
      if (retailerSignature && p7SigConfig) {
        await drawImageOnPage(page7, retailerSignature, p7SigConfig.x, p7SigConfig.y, p7SigConfig.width || 180, p7SigConfig.height || 50)
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

export async function inspectPDFTemplate(): Promise<void> {
  const pdfDoc = await loadTemplate()
  const pages = pdfDoc.getPages()
  const form = pdfDoc.getForm()
  
  console.log('%c PDF Template Inspector', 'font-size: 16px; font-weight: bold; color: #245bc1;')
  console.log(`Total pages: ${pages.length}`)
  pages.forEach((page, idx) => {
    const { width, height } = page.getSize()
    console.log(`Page ${idx + 1}: ${width.toFixed(0)} x ${height.toFixed(0)} points (${(width/72).toFixed(1)}" x ${(height/72).toFixed(1)}")`)
  })
  
  console.log('\nForm Fields:')
  try {
    const fields = form.getFields()
    if (fields.length === 0) {
      console.log('  (No AcroForm fields found)')
    } else {
      fields.forEach((field) => {
        console.log(`  - "${field.getName()}" (${field.constructor.name})`)
      })
    }
  } catch (e) {
    console.log('  (Could not read form fields)')
  }
}

export function getCalibrationPositions(): PDFTemplateConfig {
  // These positions are starting points - adjust based on your template
  // Use inspectPDFTemplate() to see page dimensions
  // Coordinates are in points (1/72 inch), origin at bottom-left
  return {
    fields: {
      company_name: { page: 1, x: 150, y: 720, fontSize: 10 },
      vat_number: { page: 1, x: 150, y: 700, fontSize: 10 },
      address: { page: 1, x: 150, y: 680, fontSize: 10 },
      mobile_number: { page: 1, x: 150, y: 660, fontSize: 10 },
      contact_person: { page: 1, x: 150, y: 640, fontSize: 10 },
      retailer_signature: { page: 3, x: 80, y: 380, width: 180, height: 50 },
      staff_signature: { page: 3, x: 320, y: 380, width: 180, height: 50 },
      date_p3: { page: 3, x: 400, y: 450, fontSize: 10 },
      company_name_p4: { page: 4, x: 100, y: 550, fontSize: 10 },
      vat_number_p4: { page: 4, x: 100, y: 530, fontSize: 10 },
      address_p4: { page: 4, x: 100, y: 510, fontSize: 10 },
      retailer_signature_p4: { page: 4, x: 80, y: 380, width: 180, height: 50 },
      date_p5: { page: 5, x: 100, y: 650, fontSize: 10 },
      shop_name: { page: 5, x: 100, y: 620, fontSize: 10 },
      shop_address: { page: 5, x: 100, y: 600, fontSize: 10 },
      date_p7: { page: 7, x: 100, y: 480, fontSize: 10 },
      retailer_name_p7: { page: 7, x: 100, y: 440, fontSize: 10 },
      retailer_signature_p7: { page: 7, x: 80, y: 350, width: 180, height: 50 },
    }
  }
}
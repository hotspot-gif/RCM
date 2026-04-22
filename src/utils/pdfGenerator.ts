import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
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
  contractNumber: string
): Promise<GeneratePDFResult> {
  try {
    const pdfDoc = await loadTemplate()
    const pages = pdfDoc.getPages()
    const form = pdfDoc.getForm()
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const contractDate = formData.contract_date || format(new Date(), 'yyyy-MM-dd')
    const formattedDate = format(new Date(contractDate), 'dd/MM/yyyy')

    const fullAddress = getFullAddress(formData)
    const contactPerson = getContactPerson(formData)

    // Helper function to find field by name (case insensitive)
    const findField = (name: string) => {
      try {
        return form.getField(name)
      } catch {
        return null
      }
    }

    // Page 1: Company Details
    if (pages[0]) {
      const fields = [
        { key: 'company_name', value: formData.company_name },
        { key: 'vat_number', value: formData.vat_number },
        { key: 'address', value: fullAddress },
        { key: 'mobile_number', value: formData.mobile_number },
        { key: 'contact_person', value: contactPerson },
      ]

      fields.forEach(({ key, value }) => {
        try {
          const field = form.getTextField(key)
          if (field) field.setText(value)
        } catch (e) {
          console.log(`Field ${key} not found on page 1`)
        }
      })
    }

    // Page 3: Signatures and Date
    if (pages[2]) {
      const page3 = pages[2]
      
      // Try to set date field
      try {
        const dateField = form.getTextField('date')
        if (dateField) dateField.setText(formattedDate)
      } catch {
        page3.drawText(formattedDate, { x: 400, y: 650, size: 10, font: helveticaFont })
      }

      // Embed retailer signature
      if (retailerSignature) {
        try {
          const sigImageBytes = await fetch(retailerSignature).then(r => r.arrayBuffer())
          const sigImage = await pdfDoc.embedPng(sigImageBytes)
          
          const sigField = form.getField('retailer_signature')
          if (sigField && sigField instanceof PDFDocument && sigField.constructor.name === 'PDFImage') {
            // If it's already an image field, we'd embed differently
          }
          
          // Draw signature image on page
          page3.drawImage('retailer_sig', {
            x: 50,
            y: 400,
            width: 200,
            height: 60,
            img: sigImage,
          })
        } catch (e) {
          // Fallback: draw as text signature area marker
          page3.drawText('Signed: ' + format(new Date(), 'dd/MM/yyyy HH:mm'), {
            x: 50,
            y: 420,
            size: 10,
            font: helveticaFont,
            color: rgb(0, 0.3, 0),
          })
        }
      }

      // Embed staff signature
      if (staffSignature) {
        try {
          const staffSigImageBytes = await fetch(staffSignature).then(r => r.arrayBuffer())
          const staffSigImage = await pdfDoc.embedPng(staffSigImageBytes)
          
          page3.drawImage('staff_sig', {
            x: 300,
            y: 400,
            width: 200,
            height: 60,
            img: staffSigImage,
          })
        } catch (e) {
          page3.drawText('Staff Signed: ' + format(new Date(), 'dd/MM/yyyy HH:mm'), {
            x: 300,
            y: 420,
            size: 10,
            font: helveticaFont,
            color: rgb(0, 0.3, 0),
          })
        }
      }
    }

    // Page 4: Retailer details repeat with signature
    if (pages[3]) {
      const page4 = pages[3]
      
      const page4Fields = [
        { key: 'company_name_p4', value: formData.company_name },
        { key: 'vat_number_p4', value: formData.vat_number },
        { key: 'address_p4', value: fullAddress },
      ]

      page4Fields.forEach(({ key, value }) => {
        try {
          const field = form.getTextField(key)
          if (field) field.setText(value)
        } catch {
          page4.drawText(value, { x: 100, y: 600, size: 10, font: helveticaFont })
        }
      })

      // Embed retailer signature on page 4
      if (retailerSignature) {
        try {
          const sigImageBytes = await fetch(retailerSignature).then(r => r.arrayBuffer())
          const sigImage = await pdfDoc.embedPng(sigImageBytes)
          
          page4.drawImage('retailer_sig_p4', {
            x: 50,
            y: 200,
            width: 200,
            height: 60,
            img: sigImage,
          })
        } catch {}
      }
    }

    // Page 5: Shop details
    if (pages[4]) {
      const page5 = pages[4]
      
      const page5Fields = [
        { key: 'date_p5', value: formattedDate },
        { key: 'shop_name', value: formData.company_name },
        { key: 'shop_address', value: fullAddress },
      ]

      page5Fields.forEach(({ key, value }) => {
        try {
          const field = form.getTextField(key)
          if (field) field.setText(value)
        } catch {
          // Draw at default positions
          if (key === 'date_p5') {
            page5.drawText(value, { x: 100, y: 700, size: 10, font: helveticaFont })
          } else if (key === 'shop_name') {
            page5.drawText(value, { x: 100, y: 650, size: 10, font: helveticaFont })
          } else if (key === 'shop_address') {
            page5.drawText(value, { x: 100, y: 620, size: 10, font: helveticaFont })
          }
        }
      })
    }

    // Page 7: Final signature page
    if (pages[6]) {
      const page7 = pages[6]
      
      const page7Fields = [
        { key: 'date_p7', value: formattedDate },
        { key: 'retailer_name_p7', value: contactPerson },
      ]

      page7Fields.forEach(({ key, value }) => {
        try {
          const field = form.getTextField(key)
          if (field) field.setText(value)
        } catch {
          if (key === 'date_p7') {
            page7.drawText(value, { x: 100, y: 500, size: 10, font: helveticaFont })
          } else if (key === 'retailer_name_p7') {
            page7.drawText(value, { x: 100, y: 450, size: 10, font: helveticaFont })
          }
        }
      })

      // Embed retailer signature on page 7
      if (retailerSignature) {
        try {
          const sigImageBytes = await fetch(retailerSignature).then(r => r.arrayBuffer())
          const sigImage = await pdfDoc.embedPng(sigImageBytes)
          
          page7.drawImage('retailer_sig_p7', {
            x: 50,
            y: 350,
            width: 200,
            height: 60,
            img: sigImage,
          })
        } catch {}
      }
    }

    // Add contract number to all pages header if needed
    pages.forEach((page, idx) => {
      const { height } = page.getSize()
      page.drawText(contractNumber, {
        x: 450,
        y: height - 30,
        size: 8,
        font: helveticaFont,
        color: rgb(0.4, 0.4, 0.4),
      })
    })

    const pdfBytes = await pdfDoc.save()
    return { success: true, pdfBytes }
  } catch (error) {
    console.error('PDF generation error:', error)
    return { success: false, error: 'Failed to generate PDF' }
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
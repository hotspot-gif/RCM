import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type PDFImage } from "pdf-lib"
import {
  page1Intro,
  page1Body,
  page2Body,
  page3Body,
  page3Outro,
  page5Body,
  page6Body,
  page7Body,
  type ContractFields,
} from "./contract-text"

// ---------- Palette ----------
const BLACK = rgb(0, 0, 0)
const MUTED = rgb(0.4, 0.4, 0.4)
const LYCA_BLUE = rgb(0x1a / 255, 0x56 / 255, 0xa3 / 255)

// ---------- Layout ----------
const PAGE_W = 595.28 // A4 portrait
const PAGE_H = 841.89
const MARGIN_X = 56
const MARGIN_TOP = 48
const MARGIN_BOTTOM = 56 // footer label sits at y=30; body must stop above this
const FOOTER_Y = 30
const BODY_SIZE = 10
const LINE_HEIGHT = 13

interface Block {
  text: string
  bold?: boolean
  align?: "left" | "center"
}

interface BuildArgs {
  fields: ContractFields
  retailerSignaturePng?: Uint8Array | null
  staffSignaturePng?: Uint8Array | null
  /** Universal Service logo as PNG bytes — rendered on page 1. */
  usLogoPng?: Uint8Array | null
  /** Lycamobile logo as PNG bytes — rendered on page 4 header. */
  lycaLogoPng?: Uint8Array | null
  /** Full name of the staff user generating/signing the contract. */
  staffSignerName?: string
}

export async function buildContractPdf({
  fields,
  retailerSignaturePng,
  staffSignaturePng,
  usLogoPng,
  lycaLogoPng,
  staffSignerName,
}: BuildArgs): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)

  const usLogo = usLogoPng ? await pdf.embedPng(usLogoPng) : null
  const lycaLogo = lycaLogoPng ? await pdf.embedPng(lycaLogoPng) : null
  const retailerSig = retailerSignaturePng ? await pdf.embedPng(retailerSignaturePng) : null
  const staffSig = staffSignaturePng ? await pdf.embedPng(staffSignaturePng) : null

  // Ensure retailer name (companyName) and staff name are uppercase as requested
  if (fields.companyName) {
    fields.companyName = fields.companyName.toUpperCase()
  }
  if (fields.contactPerson) {
    fields.contactPerson = fields.contactPerson.toUpperCase()
  }
  if (fields.firstName) {
    fields.firstName = fields.firstName.toUpperCase()
  }
  if (fields.surname) {
    fields.surname = fields.surname.toUpperCase()
  }
  if (fields.shopName) {
    fields.shopName = fields.shopName.toUpperCase()
  }

  const staffName = (staffSignerName?.trim() || "Staff").toUpperCase()

  const totalPages = 7

  // Helper: wrap text into lines fitting a given width
  const wrap = (text: string, maxW: number, f: PDFFont, size: number) => {
    if (!text) return [""]
    const words = text.split(/\s+/)
    const lines: string[] = []
    let cur = ""
    for (const w of words) {
      const test = cur ? `${cur} ${w}` : w
      if (f.widthOfTextAtSize(test, size) > maxW && cur) {
        lines.push(cur)
        cur = w
      } else {
        cur = test
      }
    }
    if (cur) lines.push(cur)
    return lines
  }

  interface Segment {
    text: string
    bold: boolean
  }

  /**
   * Draws blocks sequentially. Stops before the page footer so body copy never
   * bleeds into the page number. Returns the final Y (for the caller to append
   * additional elements like tables or signature rows).
   */
  const drawBlocks = (
    page: PDFPage,
    blocks: Block[],
    startY: number,
    pageNumber: number,
    opts?: { paragraphGap?: number; bottomLimit?: number },
  ) => {
    let y = startY
    const maxW = PAGE_W - MARGIN_X * 2
    const defaultGap = opts?.paragraphGap ?? 5
    const bottom = opts?.bottomLimit ?? MARGIN_BOTTOM
    const size = BODY_SIZE

    for (const b of blocks) {
      let text = b.text
      if (!text) {
        y -= LINE_HEIGHT / 2
        continue
      }

      // Additional space before specific headers
      if (text === "IL PRESENTE CONTRATTO È ORA MODIFICATO COME SEGUE:") {
        y -= 10
      }

      // Split text into segments (bold vs normal)
      const segments: Segment[] = []
      if (pageNumber === 4) {
        segments.push({ text, bold: b.bold || false })
      } else {
        const parts = text.split(/(\[\[B\]\].*?\[\[B\]\])/g)
        for (const p of parts) {
          if (p.startsWith("[[B]]") && p.endsWith("[[B]]")) {
            segments.push({ text: p.replace(/\[\[B\]\]/g, ""), bold: true })
          } else if (p) {
            segments.push({ text: p, bold: b.bold || false })
          }
        }
      }

      // Wrap lines considering mixed fonts
      const lines: Segment[][] = []
      let currentLine: Segment[] = []
      let currentLineWidth = 0

      for (const seg of segments) {
        const f = seg.bold ? fontBold : font
        const words = seg.text.split(/(\s+)/) // Keep whitespace
        
        for (const w of words) {
          const wWidth = f.widthOfTextAtSize(w, size)
          if (currentLineWidth + wWidth > maxW && currentLine.length > 0 && w.trim()) {
            lines.push(currentLine)
            currentLine = []
            currentLineWidth = 0
            // If it's a space at the start of a new line, skip it
            if (!w.trim()) continue
          }
          
          // Add word to current line
          if (currentLine.length > 0 && currentLine[currentLine.length - 1].bold === seg.bold) {
            currentLine[currentLine.length - 1].text += w
          } else {
            currentLine.push({ text: w, bold: seg.bold })
          }
          currentLineWidth += wWidth
        }
      }
      if (currentLine.length > 0) lines.push(currentLine)

      // Draw lines
      for (const line of lines) {
        if (y < bottom) return y
        let x = MARGIN_X
        if (b.align === "center") {
          let lineW = 0
          for (const seg of line) {
            const f = seg.bold ? fontBold : font
            lineW += f.widthOfTextAtSize(seg.text, size)
          }
          x = (PAGE_W - lineW) / 2
        }

        for (const seg of line) {
          const f = seg.bold ? fontBold : font
          page.drawText(seg.text, { x, y, size, font: f, color: BLACK })
          x += f.widthOfTextAtSize(seg.text, size)
        }
        y -= LINE_HEIGHT
      }
      y -= defaultGap
    }
    return y
  }

  const drawPageFooter = (page: PDFPage, n: number) => {
    const label = `${n} di ${totalPages}`
    const w = font.widthOfTextAtSize(label, 9)
    page.drawText(label, {
      x: PAGE_W - MARGIN_X - w,
      y: FOOTER_Y,
      size: 9,
      font,
      color: MUTED,
    })
  }

  // ---------- PAGE 1 ----------
  const p1 = pdf.addPage([PAGE_W, PAGE_H])
  if (usLogo) {
    // Constrain logo to a small banner so we leave plenty of room for body copy.
    const maxH = 58
    const maxW = 180
    const ratio = Math.min(maxW / usLogo.width, maxH / usLogo.height)
    const w = usLogo.width * ratio
    const h = usLogo.height * ratio
    p1.drawImage(usLogo, {
      x: (PAGE_W - w) / 2,
      y: PAGE_H - MARGIN_TOP - h,
      width: w,
      height: h,
    })
  }
  let y1 = PAGE_H - MARGIN_TOP - (usLogo ? 72 : 20)
  y1 = drawBlocks(p1, page1Intro(fields), y1, 1, { paragraphGap: 6 })
  y1 -= 4
  drawBlocks(p1, page1Body, y1, 1, { paragraphGap: 4 })
  drawPageFooter(p1, 1)

  // ---------- PAGE 2 ----------
  const p2 = pdf.addPage([PAGE_W, PAGE_H])
  drawBlocks(p2, page2Body, PAGE_H - 40, 2, { paragraphGap: 2 })
  drawPageFooter(p2, 2)

  // ---------- PAGE 3: clauses + SIM price table + signatures ----------
  const p3 = pdf.addPage([PAGE_W, PAGE_H])
  let y3 = drawBlocks(p3, page3Body, PAGE_H - MARGIN_TOP, 3, { paragraphGap: 4 })
  y3 -= 6
  y3 = drawSimPriceTable(p3, font, fontBold, y3)
  y3 -= 40
  y3 = drawBlocks(p3, page3Outro, y3, 3, { paragraphGap: 4 })
  y3 -= 8
  drawFourPartySignatureBlock(p3, font, retailerSig, staffSig, y3, fields, staffName)
  drawPageFooter(p3, 3)

  // ---------- PAGE 4: Modulo di Registrazione Rivenditore ----------
  const p4 = pdf.addPage([PAGE_W, PAGE_H])
  drawPage4RegistrationForm(p4, font, fontBold, fields, retailerSig, staffSig, lycaLogo)
  drawPageFooter(p4, 4)

  // ---------- PAGE 5 ----------
  const p5 = pdf.addPage([PAGE_W, PAGE_H])
  drawBlocks(p5, page5Body(fields), PAGE_H - 40, 5, { paragraphGap: 8 })
  drawPageFooter(p5, 5)

  // ---------- PAGE 6 ----------
  const p6 = pdf.addPage([PAGE_W, PAGE_H])
  drawBlocks(p6, page6Body, PAGE_H - MARGIN_TOP, 6, { paragraphGap: 4 })
  drawPageFooter(p6, 6)

  // ---------- PAGE 7 ----------
  const p7 = pdf.addPage([PAGE_W, PAGE_H])
  // Reserve 120pt at the bottom for the signature block so body text never overlaps.
  const p7BottomReserve = MARGIN_BOTTOM + 130
  let y7 = drawBlocks(p7, page7Body, PAGE_H - MARGIN_TOP, 7, {
    paragraphGap: 4,
    bottomLimit: p7BottomReserve,
  })
  // Place signature block at a fixed location near bottom.
  const sigTop = Math.min(y7 - 20, MARGIN_BOTTOM + 120)
  drawFinalSignatureBlock(p7, font, retailerSig, staffSig, sigTop, fields, staffName)
  drawPageFooter(p7, 7)

  return await pdf.save()
}

// ============================================================
// Page 3 — SIM price tables
// ============================================================

function drawSimPriceTable(
  page: PDFPage,
  font: PDFFont,
  fontBold: PDFFont,
  startY: number,
): number {
  const tableW = 380
  const x = (PAGE_W - tableW) / 2
  const colW = tableW / 2
  const rowH = 20
  let y = startY

  const drawOneTable = (
    rows: Array<{ a: string; b: string; headerStyle?: boolean }>,
    top: number,
  ) => {
    let yy = top
    for (const row of rows) {
      const isHeader = row.headerStyle
      if (isHeader) {
        page.drawRectangle({
          x,
          y: yy - rowH,
          width: tableW,
          height: rowH,
          color: rgb(0.93, 0.93, 0.93),
        })
      }
      page.drawRectangle({
        x,
        y: yy - rowH,
        width: tableW,
        height: rowH,
        borderColor: BLACK,
        borderWidth: 0.5,
      })
      page.drawLine({
        start: { x: x + colW, y: yy },
        end: { x: x + colW, y: yy - rowH },
        thickness: 0.5,
        color: BLACK,
      })
      const f = isHeader ? fontBold : font
      const textY = yy - rowH + 6
      const aW = f.widthOfTextAtSize(row.a, 10)
      const bW = f.widthOfTextAtSize(row.b, 10)
      page.drawText(row.a, { x: x + (colW - aW) / 2, y: textY, size: 10, font: f, color: BLACK })
      page.drawText(row.b, { x: x + colW + (colW - bW) / 2, y: textY, size: 10, font: f, color: BLACK })
      yy -= rowH
    }
    return yy
  }

  y = drawOneTable(
    [
      { a: "Valore nominale", b: "Prezzo", headerStyle: true },
      { a: "Scheda SIM con credito telefonico di € 0", b: "Omaggio" },
    ],
    y,
  )
  y -= 10
  y = drawOneTable(
    [
      { a: "Valore nominale", b: "Prezzo", headerStyle: true },
      { a: "Scheda SIM con credito telefonico di € 5", b: "€ 4,50" },
    ],
    y,
  )
  return y
}

/**
 * Four-slot signature block used on page 3:
 * Rivenditore / Staff / Office / Hotspot Manager / Fornitore.
 * Each row shows:
 *   ______________   ______________   ______________
 *   Label             Firmato da : <name>   Data : <date>
 */
function drawFourPartySignatureBlock(
  page: PDFPage,
  font: PDFFont,
  retailerSig: PDFImage | null,
  staffSig: PDFImage | null,
  startY: number,
  f: ContractFields,
  staffName: string,
) {
  const entries: Array<{
    label: string
    image: PDFImage | null
    signedBy: string
  }> = [
    { label: "Rivenditore", image: retailerSig, signedBy: f.contactPerson },
    { label: "Staff", image: staffSig, signedBy: staffName },
    { label: "Office / Hotspot Manager", image: null, signedBy: "" },
    { label: "Fornitore", image: null, signedBy: "" },
  ]

  let y = startY
  const rowH = 44
  const lineLen = 150
  const col1X = MARGIN_X
  const col2X = MARGIN_X + lineLen + 30
  const col3X = MARGIN_X + lineLen * 2 + 60

  for (const entry of entries) {
    if (y < MARGIN_BOTTOM + rowH - 10) break
    const lineY = y - 18
    page.drawLine({
      start: { x: col1X, y: lineY },
      end: { x: col1X + lineLen, y: lineY },
      thickness: 0.5,
      color: BLACK,
    })
    page.drawLine({
      start: { x: col2X, y: lineY },
      end: { x: col2X + lineLen, y: lineY },
      thickness: 0.5,
      color: BLACK,
    })
    page.drawLine({
      start: { x: col3X, y: lineY },
      end: { x: col3X + lineLen, y: lineY },
      thickness: 0.5,
      color: BLACK,
    })

    if (entry.image) {
      const maxW = lineLen - 10
      const maxH = 48 // Increased height for more natural scale
      const ratio = Math.min(maxW / entry.image.width, maxH / entry.image.height)
      const w = entry.image.width * ratio
      const h = entry.image.height * ratio
      page.drawImage(entry.image, {
        x: col1X + (lineLen - w) / 2,
        y: lineY - 5,
        width: w,
        height: h,
        opacity: 0.95, // Slight transparency for ink-on-paper look
      })
    }

    // Firmato da — printed name above the line
    if (entry.signedBy) {
      page.drawText(entry.signedBy.toUpperCase(), {
        x: col2X + 4,
        y: lineY + 2,
        size: 9, // Reduced from 10 to match other pages and look more natural
        font,
        color: BLACK,
      })
      // Data — filled with contract date when the row represents a signed party
      page.drawText(f.date, {
        x: col3X + 4,
        y: lineY + 2,
        size: 9, // Reduced from 10
        font: fontBold,
        color: BLACK,
      })
    }

    // Labels under each line
    page.drawText(entry.label, { x: col1X, y: lineY - 12, size: 9, font, color: BLACK })
    page.drawText("Firmato da :", { x: col2X, y: lineY - 12, size: 9, font, color: BLACK })
    page.drawText("Data :", { x: col3X, y: lineY - 12, size: 9, font, color: BLACK })

    y -= rowH
  }
}

// ============================================================
// Page 4 — Registrazione Rivenditore
// ============================================================

function drawPage4RegistrationForm(
  page: PDFPage,
  font: PDFFont,
  fontBold: PDFFont,
  f: ContractFields,
  retailerSig: PDFImage | null,
  staffSig: PDFImage | null,
  lycaLogo: PDFImage | null,
) {
  // ----- Left header: Universal Service contact block -----
  let y = PAGE_H - MARGIN_TOP
  const leftLines = [
    "Universal Service 2006 Srl",
    "Via Genzano, 195",
    "00179, Roma",
    "Italia",
    "Tel: 0689971909",
    "Fax: 06765455",
    "Email: hotspot.it@lycamobile.com",
  ]
  for (const line of leftLines) {
    page.drawText(line, { x: MARGIN_X, y, size: 10, font, color: BLACK })
    y -= 13
  }

  // ----- Right header: LycaMobile logo -----
  if (lycaLogo) {
    const maxH = 70
    const maxW = 180
    const ratio = Math.min(maxW / lycaLogo.width, maxH / lycaLogo.height)
    const w = lycaLogo.width * ratio
    const h = lycaLogo.height * ratio
    page.drawImage(lycaLogo, {
      x: PAGE_W - MARGIN_X - w,
      y: PAGE_H - MARGIN_TOP - h + 6,
      width: w,
      height: h,
    })
  }

  // ----- Title -----
  const title = "MODULO DI REGISTRAZIONE RIVENDITORE"
  const titleSize = 15
  const titleW = fontBold.widthOfTextAtSize(title, titleSize)
  const titleY = PAGE_H - MARGIN_TOP - 120
  page.drawText(title, {
    x: (PAGE_W - titleW) / 2,
    y: titleY,
    size: titleSize,
    font: fontBold,
    color: LYCA_BLUE,
  })

  page.drawText("*Da compilare a cura del Rivenditore", {
    x: MARGIN_X + 30,
    y: titleY - 40,
    size: 10,
    font,
    color: BLACK,
  })

  // ----- Two-column registration table -----
  const tableTop = titleY - 60
  const tableX = MARGIN_X + 30
  const tableW = PAGE_W - 2 * (MARGIN_X + 30)
  const col1W = 180
  const rowH = 24 // Reduced from 30 for a tighter, more professional look

  const rows: Array<[string, string]> = [
    ["Nome*", f.firstName],
    ["Cognome*", f.surname],
    ["Nome Negozio*", f.shopName],
    ["Indirizzo Negozio*", f.street],
    ["Numero Civico*", f.houseNumber],
    ["Città*", f.city],
    ["CAP*", f.postCode],
    ["Telefono Fisso*", f.landlineNumber || "-"],
    ["Telefono Mobile*", f.mobileNumber],
    ["Indirizzo Email*", f.email],
  ]

  let ry = tableTop
  for (const [label, value] of rows) {
    // Label background
    page.drawRectangle({
      x: tableX,
      y: ry - rowH,
      width: col1W,
      height: rowH,
      color: rgb(0.96, 0.96, 0.96),
    })

    page.drawRectangle({
      x: tableX,
      y: ry - rowH,
      width: tableW,
      height: rowH,
      borderColor: BLACK,
      borderWidth: 0.5,
    })
    page.drawLine({
      start: { x: tableX + col1W, y: ry },
      end: { x: tableX + col1W, y: ry - rowH },
      thickness: 0.5,
      color: BLACK,
    })
    page.drawText(label, {
      x: tableX + 8,
      y: ry - rowH + 8, // Adjusted offset for smaller rowH
      size: 10,
      font: fontBold,
      color: BLACK,
    })
    page.drawText(value, {
      x: tableX + col1W + 8,
      y: ry - rowH + 8, // Adjusted offset
      size: 10,
      font,
      color: BLACK,
    })
    ry -= rowH
  }

  // ----- Signature rows -----
  ry -= 60
  const sigLineLen = 180
  const dateLineLen = 100

  page.drawText("Firma del Rivenditore:", {
    x: tableX,
    y: ry,
    size: 10,
    font,
    color: BLACK,
  })
  const sigLineX = tableX + 140
  const sigLineY = ry - 2
  page.drawLine({
    start: { x: sigLineX, y: sigLineY },
    end: { x: sigLineX + sigLineLen, y: sigLineY },
    thickness: 0.5,
    color: BLACK,
  })
  if (retailerSig) {
    const maxW = sigLineLen - 10
    const maxH = 54 // Larger for registration form
    const ratio = Math.min(maxW / retailerSig.width, maxH / retailerSig.height)
    const w = retailerSig.width * ratio
    const h = retailerSig.height * ratio
    page.drawImage(retailerSig, {
      x: sigLineX + (sigLineLen - w) / 2,
      y: sigLineY - 5,
      width: w,
      height: h,
      opacity: 0.95,
    })
  }
  page.drawText("Data:", {
    x: sigLineX + sigLineLen + 20,
    y: ry,
    size: 10,
    font,
    color: BLACK,
  })
  const dateLineX = sigLineX + sigLineLen + 55
  page.drawLine({
    start: { x: dateLineX, y: sigLineY },
    end: { x: dateLineX + dateLineLen, y: sigLineY },
    thickness: 0.5,
    color: BLACK,
  })
  page.drawText(f.date, {
    x: dateLineX + 6,
    y: ry - 1,
    size: 10,
    font,
    color: BLACK,
  })

  ry -= 46
  page.drawText("Firma del responsabile di zona:", {
    x: tableX,
    y: ry,
    size: 10,
    font,
    color: BLACK,
  })
  const zLineX = tableX + 180
  const zLineY = ry - 2
  page.drawLine({
    start: { x: zLineX, y: zLineY },
    end: { x: zLineX + sigLineLen, y: zLineY },
    thickness: 0.5,
    color: BLACK,
  })
  if (staffSig) {
    const maxW = sigLineLen - 10
    const maxH = 54
    const ratio = Math.min(maxW / staffSig.width, maxH / staffSig.height)
    const w = staffSig.width * ratio
    const h = staffSig.height * ratio
    page.drawImage(staffSig, {
      x: zLineX + (sigLineLen - w) / 2,
      y: zLineY - 5,
      width: w,
      height: h,
      opacity: 0.95,
    })
  }

  // Blue horizontal divider
  ry -= 28
  page.drawRectangle({
    x: tableX,
    y: ry,
    width: tableW,
    height: 1.2,
    color: LYCA_BLUE,
  })

  ry -= 20
  page.drawText("**Per Uso Ufficio:", {
    x: tableX,
    y: ry,
    size: 10,
    font,
    color: BLACK,
  })
  ry -= 26
  page.drawText("Firma Office manager:", {
    x: tableX,
    y: ry,
    size: 10,
    font,
    color: BLACK,
  })
  const oLineX = tableX + 150
  page.drawLine({
    start: { x: oLineX, y: ry - 2 },
    end: { x: oLineX + sigLineLen, y: ry - 2 },
    thickness: 0.5,
    color: BLACK,
  })
}

// ============================================================
// Page 7 — Final signature block
// ============================================================

function drawFinalSignatureBlock(
  page: PDFPage,
  font: PDFFont,
  retailerSig: PDFImage | null,
  staffSig: PDFImage | null,
  startY: number,
  f: ContractFields,
  staffName: string,
) {
  const rows: Array<{ label: string; image: PDFImage | null; signedBy: string }> = [
    { label: "Rivenditore", image: retailerSig, signedBy: f.contactPerson },
    { label: "Fornitore", image: null, signedBy: "" },
  ]
  let y = startY
  const rowH = 54
  const lineLen = 150
  const col1X = MARGIN_X
  const col2X = MARGIN_X + lineLen + 30
  const col3X = MARGIN_X + lineLen * 2 + 60

  for (const row of rows) {
    if (y < MARGIN_BOTTOM + 20) break
    const lineY = y - 22
    page.drawLine({
      start: { x: col1X, y: lineY },
      end: { x: col1X + lineLen, y: lineY },
      thickness: 0.5,
      color: BLACK,
    })
    page.drawLine({
      start: { x: col2X, y: lineY },
      end: { x: col2X + lineLen, y: lineY },
      thickness: 0.5,
      color: BLACK,
    })
    page.drawLine({
      start: { x: col3X, y: lineY },
      end: { x: col3X + lineLen, y: lineY },
      thickness: 0.5,
      color: BLACK,
    })

    if (row.image) {
      const maxW = lineLen - 10
      const maxH = 50 // Larger final signature
      const ratio = Math.min(maxW / row.image.width, maxH / row.image.height)
      const w = row.image.width * ratio
      const h = row.image.height * ratio
      page.drawImage(row.image, {
        x: col1X + (lineLen - w) / 2,
        y: lineY - 5,
        width: w,
        height: h,
        opacity: 0.95,
      })
    }
    page.drawText(row.signedBy.toUpperCase(), {
      x: col2X + 4,
      y: lineY + 2,
      size: 10,
      font,
      color: BLACK,
    })
    page.drawText(f.date, {
      x: col3X + 4,
      y: lineY + 2,
      size: 10,
      font: fontBold,
      color: BLACK,
    })

    page.drawText(row.label, { x: col1X, y: lineY - 13, size: 9, font, color: BLACK })
    page.drawText("Firmato da :", { x: col2X, y: lineY - 13, size: 9, font, color: BLACK })
    page.drawText("Data :", { x: col3X, y: lineY - 13, size: 9, font, color: BLACK })

    y -= rowH
  }
}

# System Updates - PDF Integration & Field Mapping

## Recent Fixes

### 1. Input Field Focus Issue (FIXED)
**Problem:** After typing each letter, input would lose focus requiring re-selection.

**Cause:** The `InputField` component was defined inside `NewContractPage`, causing it to be recreated on every render.

**Solution:** Extracted `InputField` into its own component (`src/components/InputField.tsx`), making it stable across renders.

---

### 2. Staff Signature Capture (IMPLEMENTED)
**Added:**
- Second signature pad for staff member
- Separate state: `staffSignature` and `staffSignatureSaved`
- Both signatures required to proceed (skip still allowed)
- Staff signature embedded in PDF (page 3)
- Both signatures displayed in review step

**Files changed:**
- `NewContractPage.tsx` - Added second SignaturePad
- `SignaturePad.tsx` - Added optional `label` prop
- `dataStore.ts` - Added `staff_signature` to Contract interface
- `supabase-setup.sql` - Added `staff_signature`, `retailer_email`, `staff_email` columns

---

### 3. PDF Field Mapping (IMPROVED)
**Enhancements:**
- Auto-detection of AcroForm fields (if PDF has fillable form fields)
- Fallback to absolute positioning with configurable coordinates
- Text wrapping for address fields
- Console logging for debugging positions
- Page size inspection via `inspectPDFTemplate()`

**Usage:**
```typescript
import { inspectPDFTemplate } from '../utils/pdfGenerator'

// In browser console or component:
inspectPDFTemplate() // Logs page sizes and form field names
```

**Adjusting positions:** Edit `DEFAULT_TEMPLATE_CONFIG` in `src/utils/pdfGenerator.ts`  

---

## Database Setup

### Supabase SQL

Run `supabase-setup.sql` in your Supabase SQL Editor. This creates:

**Tables:**
- `users` - ADMIN, ASM, FSE roles with RLS
- `retailers` - retailer data
- `contracts` - contracts with signature refs

**Storage:**
- `signatures` bucket for storing signature images

**Policies:**
- Row Level Security (RLS) enabled
- Role-based access control

**Dummy Data:**
- 6 test users (1 Admin, 2 ASM, 3 FSE)
- 6 retailers
- 5 sample contracts

---

## Field Mapping Reference

### Page 1 - Company Details
| Field | PDF Key | Position (x,y) |
|-------|---------|----------------|
| Company Name | `company_name` | (150, 720) |
| VAT Number | `vat_number` | (150, 700) |
| Full Address | `address` | (150, 680) |
| Mobile Number | `mobile_number` | (150, 660) |
| Contact Person | `contact_person` | (150, 640) |

### Page 3 - Signatures
| Field | PDF Key | Position (x,y) | Size |
|-------|---------|----------------|------|
| Retailer Signature | `retailer_signature` | (80, 380) | 180×50 |
| Staff Signature | `staff_signature` | (320, 380) | 180×50 |
| Date | `date_p3` | (400, 450) | - |

### Page 4 - Duplicate Info
| Field | PDF Key | Position |
|-------|---------|----------|
| Company Name | `company_name_p4` | (100, 550) |
| VAT Number | `vat_number_p4` | (100, 530) |
| Address | `address_p4` | (100, 510) |
| Retailer Signature | `retailer_signature_p4` | (80, 380) |

### Page 5 - Shop Details
| Field | PDF Key | Position |
|-------|---------|----------|
| Date | `date_p5` | (100, 650) |
| Shop Name | `shop_name` | (100, 620) |
| Shop Address | `shop_address` | (100, 600) |

### Page 7 - Final Page
| Field | PDF Key | Position |
|-------|---------|----------|
| Date | `date_p7` | (100, 480) |
| Retailer Name | `retailer_name_p7` | (100, 440) |
| Retailer Signature | `retailer_signature_p7` | (80, 350) |

---

## Email Automation (Pending)

**Planned features:**
- Auto-send PDF to retailer and staff emails after signing
- Use Supabase Edge Functions or external email API (Resend, SendGrid)
- HTML email templates in `emailService.ts`

**Current status:** PDF is downloaded client-side. Email sending not yet connected.

---

## Quick Start

1. **Place PDF template** at `public/contract.pdf`
2. **Run Supabase SQL** from `supabase-setup.sql`
3. **Update .env** with your Supabase credentials
4. **Start dev server:** `npm run dev`
5. **Calibrate positions** if text misaligned (see below)

---

## Calibration Steps

1. Open browser console (F12)
2. Run: `inspectPDFTemplate()` - view page dimensions and form fields
3. Edit positions in `pdfGenerator.ts`
4. Test by creating a new contract
5. Repeat until aligned

**Typical adjustments:**
- If text too high → decrease Y
- If text too low → increase Y
- If text too left → increase X
- If text too right → decrease X

Coordinate system: bottom-left origin (0,0), units in points (1/72").

---

## Files Modified

| File | Changes |
|------|---------|
| `src/components/InputField.tsx` | NEW - extracted component |
| `src/components/SignaturePad.tsx` | Added `label` prop |
| `src/pages/NewContractPage.tsx` | Refactored: separate signatures, fixed input focus, added PDF generation |
| `src/store/dataStore.ts` | Added `staff_signature`, `retailer_email`, `staff_email` |
| `src/lib/supabase.ts` | Updated credentials |
| `src/utils/pdfGenerator.ts` | COMPLETELY rewritten with better mapping |
| `src/utils/pdfMapping.ts` | NEW - field mapping config |
| `src/utils/signatureStorage.ts` | NEW - Supabase upload |
| `src/utils/emailService.ts` | NEW - email templates |
| `supabase-setup.sql` | Updated with new columns and users table |
| `PDF_CALIBRATION.md` | NEW - this guide |

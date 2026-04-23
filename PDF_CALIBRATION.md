# PDF Field Calibration Guide

## Issue: Text not aligned correctly on PDF

The PDF generator uses coordinate-based positioning. If text appears in the wrong place, you need to adjust the field positions in `src/utils/pdfGenerator.ts`.

## How to calibrate:

### Step 1: Check PDF template dimensions

In your browser console (F12), run:

```javascript
import { inspectPDFTemplate } from './src/utils/pdfGenerator'
inspectPDFTemplate()
```

This will print:
- Total pages and dimensions (in points)
- Any existing AcroForm field names (if your PDF has fillable fields)

### Step 2: Understand PDF coordinate system

- Origin (0,0) is at **bottom-left** corner
- Units are **points** (1/72 inch)
- Standard A4 page: ~595 x 842 points

### Step 3: Adjust positions

Edit `DEFAULT_TEMPLATE_CONFIG` in `src/utils/pdfGenerator.ts`:

```typescript
export const DEFAULT_TEMPLATE_CONFIG: PDFTemplateConfig = {
  fields: {
    company_name: { page: 1, x: 150, y: 720, fontSize: 10 },
    vat_number: { page: 1, x: 150, y: 700, fontSize: 10 },
    // ... adjust x, y values
  }
}
```

**Quick test:** Add a temporary button in NewContractPage that logs current positions and page size:

```typescript
const testPositions = async () => {
  const result = await generateContractPDF(/* test data */)
  if (result.success) {
    downloadPDF(result.pdfBytes, 'test.pdf')
    console.log('PDF generated - check text placement')
  }
}
```

### Step 4: Tweak incrementally

- Increase X → move right
- Decrease X → move left
- Increase Y → move up
- Decrease Y → move down

Common starting positions for A4:
- Top margin ~72 pts
- Line spacing ~12-15 pts
- Typical Y values: 720 (top), 700, 680, 660...

### Step 5: Optional - Use PDF form fields

If your PDF has AcroForm fields (input fields), the generator will **auto-detect** them by common names and fill them directly. No manual positioning needed.

You can see available form fields by running `inspectPDFTemplate()` in console. The generator will try these field name variations:

- `company_name` → tries: "company_name", "companyname", "company name"
- `vat_number` → tries: "vat_number", "vatnumber", "vat number"
- etc.

## Current default positions

Page 1 (Company):
- Company name: x=150, y=720
- VAT: x=150, y=700
- Address: x=150, y=680
- Mobile: x=150, y=660
- Contact person: x=150, y=640

Page 3 (Signatures):
- Retailer signature image: x=80, y=380, 180×50
- Staff signature image: x=320, y=380, 180×50
- Date: x=400, y=450

Page 4 (Duplicate info):
- Company name: x=100, y=550
- VAT: x=100, y=530
- Address: x=100, y=510
- Retailer signature: x=80, y=380

Page 5 (Shop):
- Date: x=100, y=650
- Shop name: x=100, y=620
- Shop address: x=100, y=600

Page 7 (Final):
- Date: x=100, y=480
- Retailer name: x=100, y=440
- Retailer signature: x=80, y=350

---

**Need help?** Run `inspectPDFTemplate()` in browser console while viewing the New Contract page to get your PDF's exact dimensions.

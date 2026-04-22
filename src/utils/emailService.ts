import { supabase } from '../lib/supabase'

export interface EmailAttachment {
  content: string // base64
  filename: string
  type: string
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export async function sendContractEmail(
  toEmail: string,
  subject: string,
  htmlContent: string,
  pdfAttachment?: EmailAttachment
): Promise<SendEmailResult> {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: toEmail,
        subject,
        html: htmlContent,
        attachment: pdfAttachment,
      },
    })

    if (error) {
      console.error('Email send error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, messageId: data?.messageId }
  } catch (error) {
    console.error('Email send exception:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

export function generateContractEmailHTML(
  retailerName: string,
  contractNumber: string,
  contractDate: string,
  branch: string,
  zone: string,
  staffName: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #21264e, #46286E); padding: 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">RetailSign Contract</h1>
                  <p style="color: #a5b4fc; margin: 10px 0 0 0; font-size: 14px;">LMIT Contract Management Platform</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #21264e; margin: 0 0 20px 0; font-size: 20px;">Contract Confirmation</h2>
                  
                  <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
                    Dear <strong>${retailerName}</strong>,
                  </p>
                  
                  <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
                    Your contract has been successfully generated and signed. Please find the attached PDF document for your records.
                  </p>
                  
                  <!-- Contract Details -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; margin: 20px 0;">
                    <tr>
                      <td style="padding: 20px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                              <span style="color: #6b7280; font-size: 13px;">Contract Number</span>
                              <p style="margin: 4px 0 0 0; color: #21264e; font-weight: 600; font-size: 15px;">${contractNumber}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                              <span style="color: #6b7280; font-size: 13px;">Date</span>
                              <p style="margin: 4px 0 0 0; color: #21264e; font-weight: 600; font-size: 15px;">${contractDate}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                              <span style="color: #6b7280; font-size: 13px;">Branch</span>
                              <p style="margin: 4px 0 0 0; color: #245bc1; font-weight: 600; font-size: 15px;">${branch}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0;">
                              <span style="color: #6b7280; font-size: 13px;">Zone</span>
                              <p style="margin: 4px 0 0 0; color: #46286E; font-weight: 600; font-size: 15px;">${zone}</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="color: #6b7280; font-size: 13px; margin: 0;">
                    If you have any questions about this contract, please contact <strong>${staffName}</strong>.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center;">
                  <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    This is an automated message from RetailSign. Please do not reply to this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

export function generateStaffEmailHTML(
  staffName: string,
  retailerName: string,
  contractNumber: string,
  contractDate: string,
  branch: string,
  zone: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #245bc1, #08dc7d); padding: 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">New Contract Created</h1>
                  <p style="color: #dbeafe; margin: 10px 0 0 0; font-size: 14px;">RetailSign Platform</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #21264e; margin: 0 0 20px 0; font-size: 20px;">Contract Details</h2>
                  
                  <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
                    Hi <strong>${staffName}</strong>,
                  </p>
                  
                  <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
                    A new contract has been created. Please find the attached PDF for your records.
                  </p>
                  
                  <!-- Contract Details -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; margin: 20px 0;">
                    <tr>
                      <td style="padding: 20px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                              <span style="color: #6b7280; font-size: 13px;">Retailer</span>
                              <p style="margin: 4px 0 0 0; color: #21264e; font-weight: 600; font-size: 15px;">${retailerName}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                              <span style="color: #6b7280; font-size: 13px;">Contract Number</span>
                              <p style="margin: 4px 0 0 0; color: #245bc1; font-weight: 600; font-size: 15px;">${contractNumber}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                              <span style="color: #6b7280; font-size: 13px;">Date</span>
                              <p style="margin: 4px 0 0 0; color: #21264e; font-weight: 600; font-size: 15px;">${contractDate}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                              <span style="color: #6b7280; font-size: 13px;">Branch / Zone</span>
                              <p style="margin: 4px 0 0 0; color: #21264e; font-weight: 600; font-size: 15px;">${branch} / ${zone}</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center;">
                  <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    RetailSign - LMIT Contract Management Platform
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}
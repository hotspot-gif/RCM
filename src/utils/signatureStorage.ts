import { supabase } from '../lib/supabase'

export interface SignatureStorageResult {
  success: boolean
  url?: string
  error?: string
}

export async function uploadSignature(
  signatureDataUrl: string,
  contractId: string,
  signatureType: 'retailer' | 'staff'
): Promise<SignatureStorageResult> {
  try {
    const base64Data = signatureDataUrl.replace(/^data:image\/\w+;base64,/, '')
    const binaryString = atob(base64Data)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    const fileName = `${contractId}/${signatureType}_${Date.now()}.png`

    const { data, error } = await supabase.storage
      .from('signatures')
      .upload(fileName, bytes, {
        contentType: 'image/png',
        upsert: true,
      })

    if (error) {
      console.error('Signature upload error:', error)
      return { success: false, error: error.message }
    }

    const { data: urlData } = supabase.storage
      .from('signatures')
      .getPublicUrl(fileName)

    return { success: true, url: urlData.publicUrl }
  } catch (error) {
    console.error('Signature upload exception:', error)
    return { success: false, error: 'Failed to upload signature' }
  }
}

export async function getSignature(publicUrl: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('signatures')
      .download(publicUrl)

    if (error || !data) {
      return null
    }

    const reader = new FileReader()
    return new Promise((resolve) => {
      reader.onloadend = () => {
        resolve(reader.result as string)
      }
      reader.readAsDataURL(data)
    })
  } catch {
    return null
  }
}

export async function deleteSignature(publicUrl: string): Promise<boolean> {
  try {
    const path = publicUrl.split('/signatures/')[1]
    if (!path) return false

    const { error } = await supabase.storage
      .from('signatures')
      .remove([path])

    return !error
  } catch {
    return false
  }
}
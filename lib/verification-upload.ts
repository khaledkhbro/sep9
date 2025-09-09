import { createClient } from "@/lib/supabase/client"
import { createClient as createServerClient } from "@/lib/supabase/server"

export interface UploadResult {
  path: string
  url: string
}

export interface FileValidation {
  isValid: boolean
  error?: string
}

// Client-side file upload
export async function uploadVerificationDocument(file: File, documentType: string): Promise<UploadResult> {
  const supabase = createClient()

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error("Authentication required")
  }

  // Validate file
  const validation = validateVerificationFile(file)
  if (!validation.isValid) {
    throw new Error(validation.error)
  }

  // Create unique file path
  const fileExt = file.name.split(".").pop()?.toLowerCase()
  const timestamp = Date.now()
  const fileName = `${user.id}/${documentType}/${timestamp}.${fileExt}`

  // Upload file to storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("verification-documents")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    })

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`)
  }

  // Get public URL (signed URL for private bucket)
  const { data: urlData } = await supabase.storage
    .from("verification-documents")
    .createSignedUrl(uploadData.path, 3600 * 24 * 7) // 7 days

  return {
    path: uploadData.path,
    url: urlData?.signedUrl || "",
  }
}

// Server-side file operations
export async function getVerificationDocumentUrl(filePath: string): Promise<string> {
  const supabase = await createServerClient()

  const { data } = await supabase.storage.from("verification-documents").createSignedUrl(filePath, 3600) // 1 hour

  return data?.signedUrl || ""
}

export async function deleteVerificationDocument(filePath: string): Promise<void> {
  const supabase = await createServerClient()

  const { error } = await supabase.storage.from("verification-documents").remove([filePath])

  if (error) {
    throw new Error(`Delete failed: ${error.message}`)
  }
}

// File validation
export function validateVerificationFile(file: File): FileValidation {
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"]

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: "File size must be less than 10MB",
    }
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: "File type must be JPEG, PNG, WebP, or PDF",
    }
  }

  return { isValid: true }
}

// Get file type icon
export function getFileTypeIcon(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "🖼️"
  if (mimeType === "application/pdf") return "📄"
  return "📎"
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

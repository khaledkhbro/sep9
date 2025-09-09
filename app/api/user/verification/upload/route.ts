import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { uploadVerificationDocument, validateVerificationFile } from "@/lib/verification-upload"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const formData = await request.formData()
    const file = formData.get("file") as File
    const document_type = formData.get("document_type") as string

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!file || !document_type) {
      return NextResponse.json({ error: "File and document type are required" }, { status: 400 })
    }

    const validation = validateVerificationFile(file)
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Check if document type is enabled
    const { data: setting, error: settingError } = await supabase
      .from("verification_settings")
      .select("*")
      .eq("document_type", document_type)
      .eq("enabled", true)
      .single()

    if (settingError || !setting) {
      return NextResponse.json({ error: "Invalid or disabled document type" }, { status: 400 })
    }

    // Validate file size against settings
    if (file.size > setting.max_file_size_mb * 1024 * 1024) {
      return NextResponse.json({ error: `File size must be less than ${setting.max_file_size_mb}MB` }, { status: 400 })
    }

    // Validate file format against settings
    const fileExtension = file.name.split(".").pop()?.toLowerCase()
    if (!fileExtension || !setting.allowed_formats.includes(fileExtension)) {
      return NextResponse.json(
        { error: `Invalid file format. Allowed: ${setting.allowed_formats.join(", ")}` },
        { status: 400 },
      )
    }

    // Check for existing pending or approved request
    const { data: existingRequest } = await supabase
      .from("verification_requests")
      .select("*")
      .eq("user_id", user.id)
      .eq("document_type", document_type)
      .in("status", ["pending", "approved"])
      .single()

    if (existingRequest) {
      return NextResponse.json(
        { error: "You already have a pending or approved request for this document type" },
        { status: 400 },
      )
    }

    const uploadResult = await uploadVerificationDocument(file, document_type)

    // Create verification request with file metadata
    const { data: verificationRequest, error: requestError } = await supabase
      .from("verification_requests")
      .insert({
        user_id: user.id,
        document_type,
        file_url: uploadResult.url,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        original_filename: file.name,
        status: "pending",
      })
      .select()
      .single()

    if (requestError) {
      console.error("Error creating verification request:", requestError)
      return NextResponse.json({ error: "Failed to create verification request" }, { status: 500 })
    }

    return NextResponse.json({ verificationRequest })
  } catch (error) {
    console.error("Error in user verification upload API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

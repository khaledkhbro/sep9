import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    const body = await request.json()
    const { id } = params

    const { data, error } = await supabase
      .from("verification_settings")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating verification setting:", error)
      return NextResponse.json({ error: "Failed to update setting" }, { status: 500 })
    }

    return NextResponse.json({ setting: data })
  } catch (error) {
    console.error("Error in verification settings PATCH API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    const { id } = params

    const { error } = await supabase.from("verification_settings").delete().eq("id", id)

    if (error) {
      console.error("Error deleting verification setting:", error)
      return NextResponse.json({ error: "Failed to delete setting" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in verification settings DELETE API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

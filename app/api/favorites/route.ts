import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: favorites, error } = await supabase
      .from("user_favorites")
      .select(`
        id,
        created_at,
        job_id,
        jobs!inner (
          id,
          title,
          description,
          price,
          status,
          created_at,
          user_id,
          category_id,
          users!inner (
            id,
            full_name,
            email,
            avatar_url
          ),
          categories (
            id,
            name,
            description
          )
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Supabase error in favorites GET:", error)
      if (error.message.includes("does not exist") || error.message.includes("schema cache")) {
        console.log("[v0] Database tables not yet created, returning empty favorites")
        return NextResponse.json([])
      }
      return NextResponse.json([])
    }

    const transformedFavorites = (favorites || []).map((fav) => ({
      id: fav.jobs.id,
      title: fav.jobs.title,
      description: fav.jobs.description,
      price: fav.jobs.price,
      status: fav.jobs.status,
      created_at: fav.jobs.created_at,
      favoriteId: fav.id,
      favoritedAt: fav.created_at,
      users: {
        id: fav.jobs.users.id,
        full_name: fav.jobs.users.full_name,
        email: fav.jobs.users.email,
        avatar_url: fav.jobs.users.avatar_url,
      },
      categories: fav.jobs.categories
        ? {
            id: fav.jobs.categories.id,
            name: fav.jobs.categories.name,
            description: fav.jobs.categories.description,
          }
        : null,
    }))

    return NextResponse.json(transformedFavorites)
  } catch (error) {
    console.error("Error in favorites GET:", error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { jobId } = body

    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 })
    }

    const { data: result, error } = await supabase
      .from("user_favorites")
      .upsert(
        {
          user_id: user.id,
          job_id: jobId,
          created_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,job_id",
          ignoreDuplicates: true,
        },
      )
      .select()

    if (error) {
      console.error("Supabase error in favorites POST:", error)
      if (error.message.includes("does not exist") || error.message.includes("schema cache")) {
        return NextResponse.json({ error: "Database not ready. Please run the setup scripts first." }, { status: 503 })
      }
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    if (!result || result.length === 0) {
      return NextResponse.json({ error: "Job already in favorites" }, { status: 409 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error in favorites POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { jobId } = body

    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 })
    }

    const { error } = await supabase.from("user_favorites").delete().eq("user_id", user.id).eq("job_id", jobId)

    if (error) {
      console.error("Supabase error in favorites DELETE:", error)
      if (error.message.includes("does not exist") || error.message.includes("schema cache")) {
        return NextResponse.json({ error: "Database not ready. Please run the setup scripts first." }, { status: 503 })
      }
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in favorites DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

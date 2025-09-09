import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "5")
    const search = searchParams.get("search") || ""
    const rating = searchParams.get("rating")
    const sortBy = searchParams.get("sortBy") || "newest"
    const revieweeId = searchParams.get("revieweeId")

    const offset = (page - 1) * limit

    let query = supabase
      .from("marketplace_reviews")
      .select(
        "id, order_id, reviewer_id, reviewee_id, reviewer_type, rating, title, comment, communication_rating, quality_rating, value_rating, delivery_time_rating, created_at, updated_at",
      )
      .eq("is_deleted", false)

    // Apply search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,comment.ilike.%${search}%,reviewer_id.ilike.%${search}%`)
    }

    // Apply rating filter
    if (rating && rating !== "all") {
      query = query.eq("rating", Number.parseInt(rating))
    }

    // Apply reviewee filter
    if (revieweeId) {
      query = query.eq("reviewee_id", revieweeId)
    }

    // Apply sorting
    switch (sortBy) {
      case "oldest":
        query = query.order("created_at", { ascending: true })
        break
      case "highest":
        query = query.order("rating", { ascending: false }).order("created_at", { ascending: false })
        break
      case "lowest":
        query = query.order("rating", { ascending: true }).order("created_at", { ascending: false })
        break
      default:
        query = query.order("created_at", { ascending: false })
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: reviews, error, count } = await query

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 })
    }

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from("marketplace_reviews")
      .select("*", { count: "exact", head: true })
      .eq("is_deleted", false)

    if (countError) {
      console.error("Count error:", countError)
      return NextResponse.json({ error: "Failed to get review count" }, { status: 500 })
    }

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      order_id,
      reviewer_id,
      reviewee_id,
      reviewer_type,
      rating,
      title,
      comment,
      communication_rating,
      quality_rating,
      value_rating,
      delivery_time_rating,
    } = body

    // Validate required fields
    if (!order_id || !reviewer_id || !reviewee_id || !reviewer_type || !rating || !title || !comment) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data: existingReview, error: checkError } = await supabase
      .from("marketplace_reviews")
      .select("id")
      .eq("order_id", order_id)
      .eq("reviewer_id", reviewer_id)
      .eq("is_deleted", false)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 = no rows found
      console.error("Error checking existing review:", checkError)
      return NextResponse.json({ error: "Failed to check existing review" }, { status: 500 })
    }

    if (existingReview) {
      return NextResponse.json({ error: "Review already exists for this order" }, { status: 409 })
    }

    const { data: newReview, error: insertError } = await supabase
      .from("marketplace_reviews")
      .insert({
        order_id,
        reviewer_id,
        reviewee_id,
        reviewer_type,
        rating,
        title,
        comment,
        communication_rating: communication_rating || rating,
        quality_rating: quality_rating || rating,
        value_rating: value_rating || rating,
        delivery_time_rating: delivery_time_rating || rating,
      })
      .select()
      .single()

    if (insertError) {
      console.error("Error creating review:", insertError)
      return NextResponse.json({ error: "Failed to create review" }, { status: 500 })
    }

    return NextResponse.json(newReview, { status: 201 })
  } catch (error) {
    console.error("Error creating review:", error)
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 })
  }
}

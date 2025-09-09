import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const reviewId = Number.parseInt(params.id)
    const body = await request.json()
    const {
      rating,
      title,
      comment,
      communication_rating,
      quality_rating,
      value_rating,
      delivery_time_rating,
      reviewer_id,
    } = body

    if (!rating || !title || !comment || !reviewer_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if review exists and belongs to the reviewer
    const { data: existingReview, error: checkError } = await supabase
      .from("marketplace_reviews")
      .select("id, reviewer_id")
      .eq("id", reviewId)
      .eq("is_deleted", false)
      .single()

    if (checkError || !existingReview) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    if (existingReview.reviewer_id !== reviewer_id) {
      return NextResponse.json({ error: "Unauthorized to edit this review" }, { status: 403 })
    }

    // Update review
    const { data: updatedReview, error: updateError } = await supabase
      .from("marketplace_reviews")
      .update({
        rating,
        title,
        comment,
        communication_rating: communication_rating || rating,
        quality_rating: quality_rating || rating,
        value_rating: value_rating || rating,
        delivery_time_rating: delivery_time_rating || rating,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reviewId)
      .eq("is_deleted", false)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json(updatedReview)
  } catch (error) {
    console.error("Error updating review:", error)
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const reviewId = Number.parseInt(params.id)
    const { searchParams } = new URL(request.url)
    const reviewerId = searchParams.get("reviewerId")

    if (!reviewerId) {
      return NextResponse.json({ error: "Reviewer ID required" }, { status: 400 })
    }

    // Check if review exists and belongs to the reviewer
    const { data: existingReview, error: checkError } = await supabase
      .from("marketplace_reviews")
      .select("id, reviewer_id")
      .eq("id", reviewId)
      .eq("is_deleted", false)
      .single()

    if (checkError || !existingReview) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    if (existingReview.reviewer_id !== reviewerId) {
      return NextResponse.json({ error: "Unauthorized to delete this review" }, { status: 403 })
    }

    // Soft delete review
    const { error: deleteError } = await supabase
      .from("marketplace_reviews")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", reviewId)

    if (deleteError) throw deleteError

    return NextResponse.json({ message: "Review deleted successfully" })
  } catch (error) {
    console.error("Error deleting review:", error)
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 })
  }
}

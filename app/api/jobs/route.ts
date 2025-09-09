import { type NextRequest, NextResponse } from "next/server"
import { updateJobWorkers, getJobs } from "@/lib/jobs"
import { getMicrojobAlgorithmSettings, applyMicrojobAlgorithm } from "@/lib/microjob-algorithm"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filters = {
      category: searchParams.get("category") || undefined,
      location: searchParams.get("location") || undefined,
      search: searchParams.get("search") || undefined,
      remote: searchParams.get("remote") === "true" ? true : searchParams.get("remote") === "false" ? false : undefined,
      budget:
        searchParams.get("budgetMin") && searchParams.get("budgetMax")
          ? { min: Number(searchParams.get("budgetMin")), max: Number(searchParams.get("budgetMax")) }
          : undefined,
    }

    // Get jobs using existing logic
    let jobs = await getJobs(filters)

    // Get algorithm settings and apply if enabled
    const algorithmSettings = await getMicrojobAlgorithmSettings()

    if (algorithmSettings.is_enabled) {
      let rotationData = undefined

      // If using time rotation, get rotation tracking data
      if (algorithmSettings.algorithm_type === "time_rotation") {
        try {
          const { data: rotationResults, error } = await supabase
            .from("microjob_rotation_tracking")
            .select("job_id, last_front_page_at, front_page_duration_minutes, rotation_cycle")
            .order("last_front_page_at", { ascending: true })

          if (error) throw error
          rotationData = rotationResults
        } catch (error) {
          console.error("Error fetching rotation data:", error)
        }
      }

      // Apply the selected algorithm
      jobs = applyMicrojobAlgorithm(jobs, algorithmSettings, rotationData)

      // Update rotation tracking for time-based algorithm
      if (algorithmSettings.algorithm_type === "time_rotation" && jobs.length > 0) {
        try {
          const now = new Date().toISOString()
          const rotationHours = algorithmSettings.rotation_hours

          // Update tracking for jobs that are now on front page
          for (let i = 0; i < Math.min(jobs.length, 20); i++) {
            // Top 20 jobs considered "front page"
            const job = jobs[i]
            const { error } = await supabase.from("microjob_rotation_tracking").upsert(
              {
                job_id: job.id,
                last_front_page_at: now,
                front_page_duration_minutes: rotationHours * 60,
                rotation_cycle: 1,
                updated_at: now,
              },
              {
                onConflict: "job_id",
                ignoreDuplicates: false,
              },
            )

            if (error) throw error
          }
        } catch (error) {
          console.error("Error updating rotation tracking:", error)
        }
      }
    }

    return NextResponse.json({
      jobs,
      algorithm: {
        type: algorithmSettings.algorithm_type,
        enabled: algorithmSettings.is_enabled,
        rotation_hours: algorithmSettings.rotation_hours,
      },
    })
  } catch (error) {
    console.error("Error fetching jobs:", error)
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobId, newWorkerCount, userId } = body

    if (!jobId || !newWorkerCount || !userId) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    const result = await updateJobWorkers(jobId, newWorkerCount, userId)

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    try {
      const { error } = await supabase.from("jobs").update({ updated_at: new Date().toISOString() }).eq("id", jobId)

      if (error) throw error
    } catch (error) {
      console.error("Error updating job timestamp:", error)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Error updating worker count:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

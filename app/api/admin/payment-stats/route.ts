import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-db"

export async function GET(request: NextRequest) {
  try {
    const { data: tableCheck, error: tableError } = await supabaseAdmin
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .in("table_name", ["payment_gateway_settings", "payment_transactions"])

    if (tableError || !tableCheck || tableCheck.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Database tables not found. Please run the database setup scripts first.",
          missingTables: ["payment_gateway_settings", "payment_transactions"],
        },
        { status: 503 },
      )
    }

    const { data: stats, error } = await supabaseAdmin.rpc("get_payment_gateway_stats")

    if (error) {
      throw error
    }

    // Transform to expected format
    const statsObject: Record<string, any> = {}

    for (const row of stats || []) {
      const avgSeconds = row.avg_processing_seconds || 0
      let avgProcessingTime = "N/A"

      if (avgSeconds > 0) {
        if (avgSeconds < 60) {
          avgProcessingTime = `${Math.round(avgSeconds)} seconds`
        } else if (avgSeconds < 3600) {
          avgProcessingTime = `${Math.round(avgSeconds / 60)} minutes`
        } else {
          avgProcessingTime = `${Math.round(avgSeconds / 3600)} hours`
        }
      }

      statsObject[row.gateway_name] = {
        totalTransactions: Number.parseInt(row.total_transactions) || 0,
        totalVolume: Number.parseFloat(row.total_volume) || 0,
        successRate: Number.parseFloat(row.success_rate) || 0,
        avgProcessingTime,
      }
    }

    return NextResponse.json({ success: true, stats: statsObject })
  } catch (error) {
    console.error("Error fetching payment stats:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch payment statistics",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}

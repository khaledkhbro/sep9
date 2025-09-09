import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const country = searchParams.get("country")
    const currency = searchParams.get("currency")
    const isAdmin = searchParams.get("admin") === "true"

    const { data: tableCheck, error: tableError } = await supabaseAdmin
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", "payment_gateway_settings")

    if (tableError || !tableCheck || tableCheck.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Database tables not found. Please run the database setup scripts first.",
          missingTables: ["payment_gateway_settings"],
        },
        { status: 503 },
      )
    }

    if (isAdmin) {
      const { data: gateways, error } = await supabaseAdmin
        .from("payment_gateway_settings")
        .select(`
          id,
          name,
          display_name,
          type,
          is_enabled,
          deposit_enabled,
          withdrawal_enabled,
          deposit_fee_percentage,
          deposit_fee_fixed,
          withdrawal_fee_percentage,
          withdrawal_fee_fixed,
          min_deposit_amount,
          max_deposit_amount,
          min_withdrawal_amount,
          max_withdrawal_amount,
          processing_time_deposit,
          processing_time_withdrawal,
          supported_currencies,
          is_test_mode,
          sort_order
        `)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true })

      if (error) {
        throw error
      }

      console.log(`[v0] ✅ PAYMENT: Retrieved ${gateways?.length || 0} gateways for admin`)

      return NextResponse.json({
        success: true,
        gateways:
          gateways?.map((gateway) => ({
            id: gateway.id,
            name: gateway.name,
            display_name: gateway.display_name,
            type: gateway.type,
            is_enabled: gateway.is_enabled,
            deposit_enabled: gateway.deposit_enabled,
            withdrawal_enabled: gateway.withdrawal_enabled,
            deposit_fee_percentage: gateway.deposit_fee_percentage,
            deposit_fee_fixed: gateway.deposit_fee_fixed,
            withdrawal_fee_percentage: gateway.withdrawal_fee_percentage,
            withdrawal_fee_fixed: gateway.withdrawal_fee_fixed,
            min_deposit_amount: gateway.min_deposit_amount,
            max_deposit_amount: gateway.max_deposit_amount,
            min_withdrawal_amount: gateway.min_withdrawal_amount,
            max_withdrawal_amount: gateway.max_withdrawal_amount,
            processing_time_deposit: gateway.processing_time_deposit,
            processing_time_withdrawal: gateway.processing_time_withdrawal,
            supported_currencies: gateway.supported_currencies,
            is_test_mode: gateway.is_test_mode,
            sort_order: gateway.sort_order,
          })) || [],
      })
    }

    const { data: gateways, error } = await supabaseAdmin
      .from("payment_gateway_settings")
      .select(`
        name,
        display_name,
        type,
        deposit_fee_percentage,
        deposit_fee_fixed,
        min_deposit_amount,
        max_deposit_amount,
        supported_currencies,
        supported_countries
      `)
      .eq("is_enabled", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })

    if (error) {
      throw error
    }

    console.log(`[v0] ✅ PAYMENT: Retrieved ${gateways?.length || 0} available gateways`)

    return NextResponse.json({
      success: true,
      gateways:
        gateways?.map((gateway) => ({
          name: gateway.name,
          display_name: gateway.display_name,
          type: gateway.type,
          fee_percentage: gateway.deposit_fee_percentage,
          fee_fixed: gateway.deposit_fee_fixed,
          min_amount: gateway.min_deposit_amount,
          max_amount: gateway.max_deposit_amount,
          supported_currencies: gateway.supported_currencies,
          supported_countries: gateway.supported_countries,
        })) || [],
    })
  } catch (error) {
    console.error("[v0] ❌ PAYMENT: Error fetching gateways:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch payment gateways",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}

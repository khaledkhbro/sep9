import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Helper function to execute raw SQL queries
export async function executeQuery(query: string, params: any[] = []) {
  try {
    const { data, error } = await supabaseAdmin.rpc("execute_sql", {
      query_text: query,
      query_params: params,
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}

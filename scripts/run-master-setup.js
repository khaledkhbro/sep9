// Node.js script to execute the master setup SQL file
// Run with: node scripts/run-master-setup.js

import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMasterSetup() {
  try {
    console.log("🚀 Starting database setup...")

    // Read the master setup SQL file
    const sqlContent = readFileSync(join(__dirname, "master-setup.sql"), "utf8")

    // Split by individual script includes and execute each
    const scriptLines = sqlContent.split("\n").filter((line) => line.startsWith("\\i scripts/"))

    for (const line of scriptLines) {
      const scriptPath = line.replace("\\i ", "")
      console.log(`📄 Executing ${scriptPath}...`)

      try {
        const scriptContent = readFileSync(join(__dirname, "..", scriptPath), "utf8")
        const { error } = await supabase.rpc("exec_sql", { sql: scriptContent })

        if (error) {
          console.error(`❌ Error in ${scriptPath}:`, error.message)
        } else {
          console.log(`✅ Completed ${scriptPath}`)
        }
      } catch (fileError) {
        console.warn(`⚠️  Script ${scriptPath} not found, skipping...`)
      }
    }

    console.log("🎉 Database setup completed!")
  } catch (error) {
    console.error("❌ Setup failed:", error.message)
    process.exit(1)
  }
}

// Run the setup
runMasterSetup()

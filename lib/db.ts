import { Pool } from "pg"

let pool: Pool | null = null

export function getDb() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    })
  }
  return pool
}

export async function query(text: string, params?: any[]) {
  const db = getDb()
  const result = await db.query(text, params)
  return result
}

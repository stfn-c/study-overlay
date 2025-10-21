import { defineConfig } from 'drizzle-kit'
import * as dotenv from 'dotenv'

// Load .env.local file
dotenv.config({ path: '.env.local' })

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // Only manage public schema, don't touch auth schema
  schemaFilter: ['public'],
})

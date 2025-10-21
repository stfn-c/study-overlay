// Test file to verify Supabase connection
// Run this from a Server Component to test

import { createClient } from './server'

export async function testSupabaseConnection() {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase.from('_test').select('*').limit(1)

    if (error && error.code !== 'PGRST116') { // PGRST116 = table not found, which is fine
      console.error('Supabase connection error:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Supabase connected successfully!')
    return { success: true }
  } catch (err) {
    console.error('❌ Supabase connection failed:', err)
    return { success: false, error: String(err) }
  }
}

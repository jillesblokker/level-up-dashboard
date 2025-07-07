import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  try {
    // Create authenticated Supabase client
    const supabase = createServerSupabaseClient({ req, res })
    
    // Get userId from query parameter
    const { userId } = req.query
    
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' })
    }

    // Fetch quests from Supabase
    const { data, error } = await supabase
      .from('quests')
      .select('*')
      
    if (error) {
      console.error('Supabase error:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json(data)
  } catch (error) {
    console.error('Unexpected error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
} 
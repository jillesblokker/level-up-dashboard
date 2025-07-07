import { useState } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useAuth } from '@clerk/nextjs'

export default function QuestDebugger() {
  const [directResults, setDirectResults] = useState(null)
  const [apiResults, setApiResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const supabase = useSupabaseClient()
  const { getToken } = useAuth()
  const [result, setResult] = useState(null)

  const testDirectAccess = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('quests')
        .select('*')
        .limit(5)
      
      if (error) throw error
      setDirectResults(data)
    } catch (err) {
      setError(`Direct access error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testApiAccess = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id
      
      if (!userId) {
        setError('No authenticated user found')
        setLoading(false)
        return
      }
      
      const response = await fetch(`/api/quests?userId=${userId}`)
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API returned ${response.status}: ${errorText}`)
      }
      
      const data = await response.json()
      setApiResults(data)
    } catch (err) {
      setError(`API access error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testClerkAuth = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      const response = await fetch(
        'https://uunfpqrauivviygysjzj.supabase.co/functions/v1/test-clerk-auth',
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )
      const data = await response.json()
      setResult(data)
      console.log('Auth test result:', data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
      <h2>Quest Debugger</h2>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={testDirectAccess} disabled={loading} style={{ marginRight: '10px' }}>
          Test Direct Supabase Access
        </button>
        <button onClick={testApiAccess} disabled={loading}>
          Test API Route Access
        </button>
        <button onClick={testClerkAuth} disabled={loading} style={{ marginLeft: '10px' }}>
          {loading ? 'Testing Clerk Auth...' : 'Test Clerk Auth with Supabase Edge Function'}
        </button>
      </div>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {directResults && (
        <div>
          <h3>Direct Supabase Results:</h3>
          <pre>{JSON.stringify(directResults, null, 2)}</pre>
        </div>
      )}
      {apiResults && (
        <div>
          <h3>API Route Results:</h3>
          <pre>{JSON.stringify(apiResults, null, 2)}</pre>
        </div>
      )}
      {result && (
        <div>
          <h3>Clerk Auth Result:</h3>
          <pre style={{ background: '#222', color: '#fff', padding: 10, borderRadius: 5, marginTop: 10 }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
} 
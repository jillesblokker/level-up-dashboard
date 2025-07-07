import { useAuth } from '@clerk/nextjs'
import { useState } from 'react'

export default function QuestDebugger() {
  const { getToken } = useAuth()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

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
      <button onClick={testClerkAuth} disabled={loading} style={{ marginBottom: 10 }}>
        {loading ? 'Testing Clerk Auth...' : 'Test Clerk Auth with Supabase Edge Function'}
      </button>
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
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
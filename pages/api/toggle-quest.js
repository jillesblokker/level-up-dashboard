export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get userId from query parameters and questId, completed from body
  const { userId } = req.query;
  const { questId, completed } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  if (!questId) {
    return res.status(400).json({ error: 'questId is required' });
  }

  try {
    // Call the Supabase Edge Function
    const response = await fetch(
      `https://uunfpqrauivviygysjzj.supabase.co/functions/v1/api-quests-complete?userId=${userId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questId,
          completed: completed !== false // Default to true if not explicitly false
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Edge function error:', errorData);
      return res.status(response.status).json({ 
        error: 'Failed to toggle quest completion', 
        details: errorData 
      });
    }

    // Get the response data
    const data = await response.json();

    // Return the data
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in API route:', error);
    return res.status(500).json({ error: 'Failed to toggle quest completion' });
  }
} 
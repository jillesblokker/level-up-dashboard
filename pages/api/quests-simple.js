export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Get userId from query parameters
  const { userId } = req.query;

  try {
    // Call the Supabase Edge Function
    const response = await fetch(
      `https://uunfpqrauivviygysjzj.supabase.co/functions/v1/api-quests-simple?userId=${userId || ''}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // Get the response data
    const data = await response.json();

    // If there was an error in the Edge Function
    if (data.error) {
      console.error('Error from Edge Function:', data.error);
      return res.status(500).json({ error: data.error });
    }

    // Return the data
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in API route:', error);
    return res.status(500).json({ error: 'Failed to fetch quests' });
  }
} 
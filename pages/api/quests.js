export default async function handler(req, res) {
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    // Forward the request to your Supabase Edge Function
    const response = await fetch(
      `https://uunfpqrauivviygysjzj.supabase.co/functions/v1/api-quests?userId=${userId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error from Supabase Edge Function:', errorData);
      return res.status(response.status).json({ 
        error: 'Failed to fetch quests from Supabase',
        details: errorData
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in API route:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 
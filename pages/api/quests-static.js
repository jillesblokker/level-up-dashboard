export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
  res.setHeader('Content-Type', 'application/json');

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).send('ok');
  }

  // Create static quest data
  const quests = [
    {
      id: '1',
      title: 'Complete Your Profile',
      description: 'Fill out all fields in your profile',
      points: 50,
      category: 'onboarding',
      difficulty: 'easy',
      completed: false
    },
    {
      id: '2',
      title: 'First Contribution',
      description: 'Make your first contribution to the community',
      points: 100,
      category: 'community',
      difficulty: 'medium',
      completed: false
    },
    {
      id: '3',
      title: 'Share Knowledge',
      description: 'Create your first tutorial or guide',
      points: 150,
      category: 'content',
      difficulty: 'hard',
      completed: false
    }
  ];

  res.status(200).json({
    quests,
    message: 'Static quest data loaded successfully'
  });
} 
export async function GET(request) {
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
  return Response.json({ quests, message: 'Static quest data loaded successfully' });
} 
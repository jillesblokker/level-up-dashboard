import { redirect } from 'next/navigation';

export default function ChallengesPage() {
    redirect('/quests?tab=challenges');
}

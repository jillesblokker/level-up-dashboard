import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to Daily Hub - the new unified landing page
  redirect('/daily-hub');
}


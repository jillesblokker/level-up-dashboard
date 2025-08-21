import { redirect } from 'next/navigation';

export default function HomePage() {
  // Force Vercel rebuild - updated 2024-12-19
  redirect('/kingdom');
}


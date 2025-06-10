import { Metadata } from 'next';
import { LoginForm } from '@/components/auth/login-form';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Login to your account',
};

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex flex-col lg:flex-row">
      {/* Medieval Cover Image Section */}
      <div className="relative flex-1 hidden lg:flex flex-col justify-between bg-black border-r-2 border-amber-800/40">
        <Image
          src="/images/realm-header.jpg"
          alt="Realm Cover"
          fill
          className="object-cover object-center opacity-90"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-amber-900/60" />
        <div className="relative z-10 flex items-center p-10 text-3xl font-medieval text-amber-500 drop-shadow-lg">
          <span className="logo">Thrivehaven</span>
        </div>
        <div className="relative z-10 p-10 text-white text-lg font-serif italic">
          <blockquote className="space-y-2">
            <p>&ldquo;Level up your life, one quest at a time.&rdquo;</p>
          </blockquote>
        </div>
      </div>
      {/* Login Form Section */}
      <div className="flex-1 flex items-center justify-center bg-black">
        <div className="w-full max-w-md p-8 rounded-lg shadow-lg bg-black/80 border border-amber-800/30">
          <div className="flex flex-col space-y-2 text-center mb-6">
            <h1 className="text-3xl font-medieval text-amber-500 drop-shadow">Welcome back</h1>
            <p className="text-md text-amber-200">Enter your credentials to continue</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
} 
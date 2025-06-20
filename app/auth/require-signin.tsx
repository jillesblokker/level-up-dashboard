import { SignInButton } from "@clerk/nextjs";
import Image from 'next/image';

export default function RequireSignIn() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black">
      {/* Medieval Cover Image */}
      <Image
        src="/images/realm-header.jpg"
        alt="Realm Cover"
        fill
        className="object-cover object-center"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-amber-900/30" />
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-md p-8 rounded-lg shadow-lg bg-black/80 border border-amber-800/30">
        <h2 className="text-2xl font-medieval text-amber-500 drop-shadow mb-4 text-center">
          Welcome to the world of Thrivehaven.<br />
          <span className="text-base font-normal text-amber-200 block mt-4">
            It&apos;s time to join the cause and work your way up from squire to habbit god. Become stronger, smarter, and achieve amazing milestones. Level up by mastering habits. The only thing left is to sign in to enter the realm.
          </span>
        </h2>
        <SignInButton>
          <button className="px-6 py-3 bg-amber-500 text-white rounded-lg shadow hover:bg-amber-600 transition-colors text-lg font-semibold mt-2">
            Sign in
          </button>
        </SignInButton>
      </div>
    </div>
  );
} 
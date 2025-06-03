import { SignInButton } from "@clerk/nextjs";

export default function RequireSignIn() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
      <h2 className="text-2xl font-bold mb-4">You need to sign in to continue</h2>
      <SignInButton>
        <button className="px-6 py-3 bg-amber-500 text-white rounded-lg shadow hover:bg-amber-600 transition-colors text-lg font-semibold mt-2">
          Go to Sign In
        </button>
      </SignInButton>
    </div>
  );
} 
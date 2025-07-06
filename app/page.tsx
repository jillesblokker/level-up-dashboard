import { SignIn } from "@clerk/nextjs";

export default function Test() {
  if (typeof window !== 'undefined') {
    console.log("Rendering Clerk SignIn page");
  }
  return <SignIn />;
}


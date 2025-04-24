import { ReactNode } from "react";

export default async function KingdomLayout({
  children,
}: {
  children: ReactNode;
}) {
  // No auth check here - let middleware handle authentication
  return (
    <div className="kingdom-layout">
      {children}
    </div>
  );
} 
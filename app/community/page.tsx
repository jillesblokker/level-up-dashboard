"use client"

import { NavBar } from "@/components/nav-bar"
import { CommunityComponent } from "@/components/community-fix"

export default function CommunityPage() {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <NavBar />
      <CommunityComponent />
    </div>
  )
}


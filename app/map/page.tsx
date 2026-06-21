"use client"

import { TEXT_CONTENT } from "@/lib/text-content"

export default function MapRedirect() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-lg">{TEXT_CONTENT.map.redirect}</p>
    </div>
  )
}


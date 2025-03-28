"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function MapRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    router.push("/realm")
  }, [router])
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-lg">Redirecting to Realm Builder...</p>
    </div>
  )
}


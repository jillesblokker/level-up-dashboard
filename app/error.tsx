"use client"

import { logger } from "@/lib/logger";

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { TEXT_CONTENT } from "@/lib/text-content"

function isChunkLoadError(error: Error): boolean {
  return (
    error.name === "ChunkLoadError" ||
    error.message?.includes("Loading chunk") ||
    error.message?.includes("Failed to fetch dynamically imported module") ||
    error.message?.includes("Importing a module script failed")
  )
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (isChunkLoadError(error)) {
      // Guard against infinite reload loops: only auto-reload once per session
      const reloadKey = "chunk_error_reload"
      const lastReload = sessionStorage.getItem(reloadKey)
      const now = Date.now()
      if (!lastReload || now - Number(lastReload) > 10_000) {
        sessionStorage.setItem(reloadKey, String(now))
        window.location.reload()
        return
      }
    }
    // Log non-chunk errors normally
    logger.error(error)
  }, [error])

  // If it's a chunk error we're about to reload — show a brief loading state
  if (isChunkLoadError(error)) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-black border-2 border-amber-800/50 rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-amber-500 mb-4">🔄 Updating…</h1>
          <p className="text-amber-300">A new version is available. Reloading the app…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-black border-2 border-amber-800/50 rounded-lg p-8 text-center">
        <h1 className="text-4xl font-bold text-amber-500 mb-4">{TEXT_CONTENT.errorPage.generic.title}</h1>

        <div className="bg-amber-900/20 border border-amber-800/20 rounded-lg p-4 mb-6">
          <p className="text-amber-300 text-lg">
            {TEXT_CONTENT.errorPage.generic.description}
          </p>
          <p className="text-amber-500/80 text-sm mt-2 font-mono break-all">
            {error.message}
          </p>
        </div>

        <p className="text-zinc-400 mb-8">
          {TEXT_CONTENT.errorPage.generic.investigate}
        </p>

        <div className="space-y-3">
          <Button
            onClick={() => reset()}
            className="w-full bg-amber-700 hover:bg-amber-600"
          >
            {TEXT_CONTENT.errorPage.generic.tryAgain}
          </Button>

          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="w-full border-amber-800/20 text-amber-500 hover:bg-amber-900/30"
          >
            {TEXT_CONTENT.errorPage.generic.return}
          </Button>
        </div>
      </div>
    </div>
  )
}
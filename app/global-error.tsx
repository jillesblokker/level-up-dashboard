"use client"

import { useEffect } from "react"

function isChunkLoadError(error: Error): boolean {
  return (
    error.name === "ChunkLoadError" ||
    error.message?.includes("Loading chunk") ||
    error.message?.includes("Failed to fetch dynamically imported module") ||
    error.message?.includes("Importing a module script failed")
  )
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (isChunkLoadError(error)) {
      const reloadKey = "chunk_error_reload_global"
      const lastReload = sessionStorage.getItem(reloadKey)
      const now = Date.now()
      if (!lastReload || now - Number(lastReload) > 10_000) {
        sessionStorage.setItem(reloadKey, String(now))
        window.location.reload()
        return
      }
    }
    console.error(error)
  }, [error])

  if (isChunkLoadError(error)) {
    return (
      <html>
        <body style={{ background: "#111", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", margin: 0, fontFamily: "sans-serif" }}>
          <div style={{ textAlign: "center", color: "#f59e0b" }}>
            <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>🔄 Updating…</h1>
            <p style={{ color: "#fcd34d" }}>A new version is available. Reloading the app…</p>
          </div>
        </body>
      </html>
    )
  }

  return (
    <html>
      <body style={{ background: "#111", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", margin: 0, fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "center", color: "#f59e0b", maxWidth: 400, padding: "2rem" }}>
          <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>⚠️ Something went wrong</h1>
          <p style={{ color: "#fcd34d", marginBottom: "1.5rem" }}>{error.message}</p>
          <button
            onClick={reset}
            style={{ background: "#b45309", color: "white", border: "none", padding: "0.75rem 2rem", borderRadius: "0.5rem", cursor: "pointer", fontSize: "1rem" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}

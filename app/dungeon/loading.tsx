import { NavBar } from "@/components/nav-bar"
import { Skull } from "lucide-react"

export default function DungeonLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <NavBar />

      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center mb-6">
            <Skull className="h-8 w-8 mr-3 text-red-500" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight font-serif">Dungeon Challenge</h1>
              <p className="text-muted-foreground">Defeat the monster by finding matching pairs</p>
            </div>
          </div>

          <div className="w-full h-[600px] rounded-lg bg-gradient-to-b from-black to-gray-900 border border-amber-800/20 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading dungeon challenge...</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}


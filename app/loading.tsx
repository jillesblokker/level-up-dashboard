export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="flex flex-col items-center">
        <div className="border-amber-500/20 border-t-amber-500 border-4 rounded-full w-12 h-12 border-t-4 animate-spin mb-4"></div>
        <p className="text-amber-500 text-lg font-medieval">Loading your adventure...</p>
      </div>
    </div>
  )
} 
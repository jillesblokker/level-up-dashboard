import { Crown } from "lucide-react"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  variant?: "full" | "icon"
}

export function Logo({ size = "md", variant = "full" }: LogoProps) {
  const getSizeClass = () => {
    switch (size) {
      case "sm":
        return "h-6"
      case "md":
        return "h-8"
      case "lg":
        return "h-10"
      default:
        return "h-8"
    }
  }

  return (
    <div className={`flex items-center ${getSizeClass()}`}>
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-700 blur-sm opacity-70"></div>
        <div className="relative flex items-center justify-center bg-black border-2 border-amber-800/50 rounded-md p-1">
          <Crown className={`${size === "sm" ? "w-4 h-4" : size === "md" ? "w-6 h-6" : "w-8 h-8"} text-amber-500`} />
        </div>
      </div>
      {/* Removed the "Level Up" text */}
    </div>
  )
}


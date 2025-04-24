import { Loader2 } from "lucide-react"

export default function AuthLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">
          Authenticating...
        </p>
      </div>
    </div>
  )
} 
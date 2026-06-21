import { HelpCircle } from "lucide-react"

interface QuestionMarkProps {
  className?: string
}

export function QuestionMark({ className }: QuestionMarkProps) {
  return <HelpCircle className={className} />
} 
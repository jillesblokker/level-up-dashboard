import { RiddleChallenge } from "@/components/riddle-challenge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, Scroll, Award } from "lucide-react"

export default function RiddlesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-medieval mb-6 flex items-center">
        <Scroll className="mr-2 h-6 w-6" /> The Riddle Master&apos;s Challenge
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <RiddleChallenge />
        </div>

        <div className="space-y-6">
          <Card className="medieval-card">
            <CardHeader className="bg-amber-800/10 border-b border-amber-800/20">
              <CardTitle className="text-xl font-medieval flex items-center">
                <Brain className="mr-2 h-5 w-5" /> Riddle Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="mr-2 text-amber-800">•</span>
                  <span>
                    Each correct answer earns you <strong>50 XP</strong>
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-amber-800">•</span>
                  <span>
                    Each incorrect answer costs <strong>50 gold</strong>
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-amber-800">•</span>
                  <span>You must have enough gold to attempt a riddle</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-amber-800">•</span>
                  <span>Riddles become more challenging as you progress</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-amber-800">•</span>
                  <span>Earn special titles by solving many riddles</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="medieval-card">
            <CardHeader className="bg-amber-800/10 border-b border-amber-800/20">
              <CardTitle className="text-xl font-medieval flex items-center">
                <Award className="mr-2 h-5 w-5" /> Riddle Titles
              </CardTitle>
              <CardDescription>Earn these prestigious titles by solving riddles</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-3">
                <li className="flex justify-between items-center">
                  <span className="font-medieval">Novice Riddler</span>
                  <span className="text-sm text-muted-foreground">5 riddles</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="font-medieval">Puzzle Solver</span>
                  <span className="text-sm text-muted-foreground">15 riddles</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="font-medieval">Enigma Master</span>
                  <span className="text-sm text-muted-foreground">30 riddles</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="font-medieval">Riddle Sage</span>
                  <span className="text-sm text-muted-foreground">50 riddles</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="font-medieval text-amber-600 dark:text-amber-400">Grand Sphinx</span>
                  <span className="text-sm text-muted-foreground">100 riddles</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


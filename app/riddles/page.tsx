import { RiddleChallenge } from "@/components/riddle-challenge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, Scroll, Award } from "lucide-react"
import { TEXT_CONTENT } from "@/lib/text-content"

export default function RiddlesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-medieval mb-6 flex items-center">
        <Scroll className="mr-2 h-6 w-6" /> {TEXT_CONTENT.riddles.title}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <RiddleChallenge />
        </div>

        <div className="space-y-6">
          <Card className="medieval-card">
            <CardHeader className="bg-amber-800/10 border-b border-amber-800/20">
              <CardTitle className="text-xl font-medieval flex items-center">
                <Brain className="mr-2 h-5 w-5" /> {TEXT_CONTENT.riddles.rules.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="mr-2 text-amber-800">•</span>
                  <span>
                    {TEXT_CONTENT.riddles.rules.xpReward} <strong>{TEXT_CONTENT.riddles.rules.xpAmount}</strong>
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-amber-800">•</span>
                  <span>
                    {TEXT_CONTENT.riddles.rules.goldCost} <strong>{TEXT_CONTENT.riddles.rules.goldAmount}</strong>
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-amber-800">•</span>
                  <span>{TEXT_CONTENT.riddles.rules.requirement}</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-amber-800">•</span>
                  <span>{TEXT_CONTENT.riddles.rules.challenge}</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-amber-800">•</span>
                  <span>{TEXT_CONTENT.riddles.rules.titles}</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="medieval-card">
            <CardHeader className="bg-amber-800/10 border-b border-amber-800/20">
              <CardTitle className="text-xl font-medieval flex items-center">
                <Award className="mr-2 h-5 w-5" /> {TEXT_CONTENT.riddles.titles.title}
              </CardTitle>
              <CardDescription>{TEXT_CONTENT.riddles.titles.desc}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-3">
                <li className="flex justify-between items-center">
                  <span className="font-medieval">{TEXT_CONTENT.riddles.titles.novice.title}</span>
                  <span className="text-sm text-muted-foreground">{TEXT_CONTENT.riddles.titles.novice.count}</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="font-medieval">{TEXT_CONTENT.riddles.titles.solver.title}</span>
                  <span className="text-sm text-muted-foreground">{TEXT_CONTENT.riddles.titles.solver.count}</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="font-medieval">{TEXT_CONTENT.riddles.titles.master.title}</span>
                  <span className="text-sm text-muted-foreground">{TEXT_CONTENT.riddles.titles.master.count}</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="font-medieval">{TEXT_CONTENT.riddles.titles.sage.title}</span>
                  <span className="text-sm text-muted-foreground">{TEXT_CONTENT.riddles.titles.sage.count}</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="font-medieval text-amber-600 dark:text-amber-400">{TEXT_CONTENT.riddles.titles.sphinx.title}</span>
                  <span className="text-sm text-muted-foreground">{TEXT_CONTENT.riddles.titles.sphinx.count}</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


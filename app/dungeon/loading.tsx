import { LoadingScreen } from "@/components/loading-screen"
import { Skull } from "lucide-react" export default function DungeonLoading() { return ( <LoadingScreen title="Descending into the Depths" icon={<Skull className="w-12 h-12" />} variant="amber" content={ <> The cold damp air rises from the ancient stones.<br /> Monsters and ancient guardians await the brave.<br /> Only those with true grit and legendary gear survive the abyss. </> } /> )
}

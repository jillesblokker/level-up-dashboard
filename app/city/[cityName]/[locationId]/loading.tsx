import { LoadingScreen } from "@/components/loading-screen"
import { MapPin } from "lucide-react" export default function LocationLoading() { return ( <LoadingScreen title="Entering the District" icon={<MapPin className="w-12 h-12" />} variant="amber" content={ <> The cobblestone streets lead to many wonders.<br /> Every building holds a secret, every person a story.<br /> Explore the city to discover its hidden potential. </> } /> )
}

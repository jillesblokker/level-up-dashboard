import { LoadingScreen } from "@/components/loading-screen"
import { MapIcon } from "lucide-react"
import { TEXT_CONTENT } from "@/lib/text-content" export default function RealmLoading() { return ( <LoadingScreen title="Exploring the lands of Valoreth" icon={<MapIcon className="w-12 h-12" />} variant="amber" content={ <> King Necrion sought treasures of growth in this mystical land.<br /> Through ancient forests and crystal caves he wandered.<br /> Each terrain reveals new mysteries and hidden wisdom. </> } /> )
} 
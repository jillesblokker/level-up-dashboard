import { LoadingScreen } from "@/components/loading-screen"
import { ShoppingBag } from "lucide-react"

export default function MarketLoading() {
  return (
    <LoadingScreen
      title="Approaching the Market Square"
      icon={<ShoppingBag className="w-12 h-12" />}
      variant="amber"
      content={
        <>
          Merchant banners flutter in the morning breeze.<br />
          Trade your gold for rare artifacts and legendary gear.<br />
          The finest shops in the realm open their doors to you.
        </>
      }
    />
  )
}

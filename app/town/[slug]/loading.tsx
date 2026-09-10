import { LoadingScreen } from "@/components/loading-screen"

export default function TownLoading() {
  return (
    <LoadingScreen
      title="Approaching the Settlement"
      variant="amber"
      content={
        <>
          Hearth fires flicker warmly in the distance.<br />
          Merchants unpack rare wares and travelers share quiet tales.<br />
          The settlement gates open to welcome your steps.
        </>
      }
    />
  )
}

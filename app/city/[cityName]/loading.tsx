import { LoadingScreen } from "@/components/loading-screen"

export default function CityLoading() {
  return (
    <LoadingScreen
      title="Entering the City Gates"
      variant="amber"
      content={
        <>
          Towering stone ramparts rise against the kingdom sky.<br />
          Banners flutter upon castle parapets as guards stand watch.<br />
          The bustling avenues and grand markets await.
        </>
      }
    />
  )
}

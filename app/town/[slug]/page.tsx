import TownClient from "./town-client"

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function TownPage({ params }: Props) {
  const resolvedParams = await params
  return <TownClient slug={resolvedParams.slug} />
} 
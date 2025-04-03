import TownClient from './town-client'

interface Props {
  params: {
    slug: string
  }
}

export default function TownPage({ params }: Props) {
  return <TownClient slug={params.slug} />
} 
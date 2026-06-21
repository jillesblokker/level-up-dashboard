'use client'
import TownClient from './town-client'
import { use } from 'react'

interface Props {
  params: Promise<{ slug: string }>
}

export default function TownPage({ params }: Props) {
  const { slug } = use(params)
  return <TownClient slug={slug} />
} 
"use client" import { useEffect } from "react"
import { useRouter } from "next/navigation" /** * The inventory has moved into the Kingdom bag panel (🎒 icon on the kingdom page). * This page now redirects automatically so no links are broken. */
export default function InventoryPage() { const router = useRouter() useEffect(() => { router.replace("/kingdom") }, [router]) return null
}

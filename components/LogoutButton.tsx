'use client' import { LogOut } from 'lucide-react'
import { logout } from '@/app/actions/auth' export function LogoutButton() { return ( <form action={logout}> <button type="submit" className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors" > <LogOut className="h-4 w-4" /> <span>Logout</span> </button> </form> )
} 
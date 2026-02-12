'use client'

import { LogOut } from 'lucide-react'

export default function LogoutButton() {
  const handleLogout = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      await supabase.auth.signOut()
      window.location.href = '/'
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
    >
      <LogOut className="w-4 h-4" />
      Sign out
    </button>
  )
}

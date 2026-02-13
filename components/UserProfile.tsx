'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from 'lucide-react'
import LogoutButton from './LogoutButton'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface UserProfileProps {
  initialUser: SupabaseUser
}

export default function UserProfile({ initialUser }: UserProfileProps) {
  const [user, setUser] = useState<SupabaseUser>(initialUser)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event)
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
        } else if (event === 'SIGNED_OUT') {
          // Redirect to home if signed out
          window.location.href = '/'
        } else if (event === 'USER_UPDATED' && session?.user) {
          setUser(session.user)
        }
      }
    )

    // Also refresh user data periodically when tab becomes visible
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        setIsLoading(true)
        try {
          const { data: { user: currentUser } } = await supabase.auth.getUser()
          if (currentUser) {
            setUser(currentUser)
          }
        } catch (err) {
          console.error('Failed to refresh user:', err)
        } finally {
          setIsLoading(false)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return (
    <div className="flex items-center gap-4">
      <div className={`flex items-center gap-2 text-sm text-gray-600 ${isLoading ? 'opacity-50' : ''}`}>
        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
          {user.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt="Profile"
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <User className="w-4 h-4" />
          )}
        </div>
        <span className="hidden sm:inline">
          {user.user_metadata?.full_name || user.email}
        </span>
      </div>
      <LogoutButton />
    </div>
  )
}

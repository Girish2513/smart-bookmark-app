'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import BookmarkItem from './BookmarkItem'
import type { Bookmark } from '@/types/bookmark'
import { BookmarkIcon, RefreshCw } from 'lucide-react'

interface BookmarkListProps {
  initialBookmarks: Bookmark[]
  userId: string
}

export default function BookmarkList({ initialBookmarks, userId }: BookmarkListProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks)
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const channelRef = useRef<any>(null)

  // Function to fetch latest bookmarks
  const fetchBookmarks = useCallback(async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (!error && data) {
        console.log('Fetched bookmarks:', data.length)
        setBookmarks(data)
      }
    } catch (err) {
      console.error('Failed to fetch bookmarks:', err)
    }
  }, [userId])

  // Set up real-time subscription
  useEffect(() => {
    const setupRealtime = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()

        // Clean up existing channel if any
        if (channelRef.current) {
          channelRef.current.unsubscribe()
        }

        // Subscribe to bookmarks table changes
        channelRef.current = supabase
          .channel(`bookmarks:${userId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'bookmarks',
              filter: `user_id=eq.${userId}`,
            },
            (payload: any) => {
              console.log('Real-time update received:', payload)
              setLastUpdate(new Date().toLocaleTimeString())
              
              if (payload.eventType === 'INSERT') {
                const newBookmark = payload.new as Bookmark
                setBookmarks((prev) => {
                  // Check if already exists
                  if (prev.find((b) => b.id === newBookmark.id)) {
                    return prev
                  }
                  return [newBookmark, ...prev]
                })
              } else if (payload.eventType === 'DELETE') {
                setBookmarks((prev) => prev.filter((b) => b.id !== payload.old.id))
              } else if (payload.eventType === 'UPDATE') {
                setBookmarks((prev) =>
                  prev.map((b) => (b.id === payload.new.id ? (payload.new as Bookmark) : b))
                )
              }
            }
          )
          .subscribe((status: string) => {
            console.log('Realtime subscription status:', status)
            setIsRealtimeConnected(status === 'SUBSCRIBED')
          })
      } catch (err) {
        console.error('Failed to setup realtime:', err)
      }
    }

    setupRealtime()

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
      }
    }
  }, [userId])

  // Refresh when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Tab became visible, refreshing bookmarks...')
        fetchBookmarks()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [fetchBookmarks])

  // Listen for custom refresh event from AddBookmarkForm
  useEffect(() => {
    const handleRefresh = () => {
      fetchBookmarks()
    }
    
    window.addEventListener('bookmarks:refresh', handleRefresh)
    return () => window.removeEventListener('bookmarks:refresh', handleRefresh)
  }, [fetchBookmarks])

  const handleRefresh = () => {
    fetchBookmarks()
  }

  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
        <BookmarkIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">No bookmarks yet</h3>
        <p className="text-gray-500">Add your first bookmark above to get started!</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Your Bookmarks ({bookmarks.length})
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {lastUpdate && `Updated: ${lastUpdate}`}
          </span>
          <span className="text-xs text-gray-500">
            {isRealtimeConnected ? '● Live' : '● Offline'}
          </span>
          <div
            className={`w-2 h-2 rounded-full ${
              isRealtimeConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh bookmarks"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {bookmarks.map((bookmark) => (
          <BookmarkItem
            key={bookmark.id}
            bookmark={bookmark}
            onDelete={fetchBookmarks}
          />
        ))}
      </div>
    </div>
  )
}

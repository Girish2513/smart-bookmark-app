'use client'

import { useEffect, useState, useCallback } from 'react'
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
        setBookmarks(data)
      }
    } catch (err) {
      console.error('Failed to fetch bookmarks:', err)
    }
  }, [userId])

  // Set up real-time subscription
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any = null

    const setupRealtime = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()

        // Subscribe to bookmarks table changes
        channel = supabase
          .channel('bookmarks_changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'bookmarks',
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              console.log('Real-time update:', payload)
              
              if (payload.eventType === 'INSERT') {
                setBookmarks((prev) => {
                  // Check if already exists (optimistic update might have added it)
                  if (prev.find((b) => b.id === payload.new.id)) {
                    return prev
                  }
                  return [payload.new as Bookmark, ...prev]
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
          .subscribe((status) => {
            console.log('Realtime subscription status:', status)
            setIsRealtimeConnected(status === 'SUBSCRIBED')
          })
      } catch (err) {
        console.error('Failed to setup realtime:', err)
      }
    }

    setupRealtime()

    return () => {
      if (channel) {
        channel.unsubscribe()
      }
    }
  }, [userId])

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
          <div
            className={`w-2 h-2 rounded-full ${
              isRealtimeConnected ? 'bg-green-500' : 'bg-yellow-500'
            }`}
            title={isRealtimeConnected ? 'Real-time connected' : 'Connecting...'}
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

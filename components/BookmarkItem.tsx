'use client'

import { Trash2, ExternalLink, Loader2 } from 'lucide-react'
import { useState } from 'react'
import type { Bookmark } from '@/types/bookmark'

interface BookmarkItemProps {
  bookmark: Bookmark
  onDelete: () => void
}

export default function BookmarkItem({ bookmark, onDelete }: BookmarkItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this bookmark?')) return
    
    setIsDeleting(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', bookmark.id)

      if (error) throw error
      onDelete()
    } catch (err) {
      console.error('Failed to delete bookmark:', err)
      alert('Failed to delete bookmark')
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="group bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate mb-1">
            {bookmark.title}
          </h3>
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline truncate"
          >
            {bookmark.url}
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
          </a>
          <p className="text-xs text-gray-400 mt-2">
            Added {formatDate(bookmark.created_at)}
          </p>
        </div>

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
          title="Delete bookmark"
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  )
}

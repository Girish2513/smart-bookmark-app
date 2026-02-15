'use client'

import { useState } from 'react'
import { Plus, Loader2, Check } from 'lucide-react'
import type { BookmarkInsert } from '@/types/bookmark'

interface AddBookmarkFormProps {
  userId: string
}

// Check if string looks like a valid domain (has at least one dot and valid characters)
function looksLikeDomain(input: string): boolean {
  // Remove protocol if present for domain check
  const withoutProtocol = input.replace(/^https?:\/\//i, '')
  
  // Domain pattern: letters, numbers, hyphens, dots. Must have at least one dot (for TLD)
  // Examples: google.com, girish-saana.vercel.app, sub.domain.co.uk
  const domainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]*(\.[a-zA-Z0-9][a-zA-Z0-9-]*)+$/
  
  return domainPattern.test(withoutProtocol) && withoutProtocol.includes('.')
}

// URL validation function
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString)
    // Only allow http and https protocols
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

// Check for dangerous protocols (XSS prevention)
function hasDangerousProtocol(input: string): boolean {
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'ftp:']
  const lowerInput = input.toLowerCase().trim()
  return dangerousProtocols.some(protocol => lowerInput.startsWith(protocol))
}

export default function AddBookmarkForm({ userId }: AddBookmarkFormProps) {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    // Trim the input
    const trimmedInput = url.trim()

    if (!trimmedInput) {
      setError('Please enter a URL')
      setIsLoading(false)
      return
    }

    // Check for dangerous protocols (XSS prevention)
    if (hasDangerousProtocol(trimmedInput)) {
      setError('Invalid URL. JavaScript and data URLs are not allowed for security reasons.')
      setIsLoading(false)
      return
    }

    // Auto-add https:// if no protocol
    let formattedUrl = trimmedInput
    if (!trimmedInput.match(/^https?:\/\//i)) {
      formattedUrl = `https://${trimmedInput}`
    }

    // Check if it looks like a valid domain (has TLD)
    if (!looksLikeDomain(trimmedInput)) {
      setError('Please enter a valid URL with a domain (e.g., google.com, example.org)')
      setIsLoading(false)
      return
    }

    // Final URL validation
    if (!isValidUrl(formattedUrl)) {
      setError('Please enter a valid URL')
      setIsLoading(false)
      return
    }

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const newBookmark: BookmarkInsert = {
        user_id: userId,
        title: title.trim() || formattedUrl,
        url: formattedUrl,
      }

      const { data, error } = await supabase
        .from('bookmarks')
        .insert(newBookmark)
        .select()

      if (error) throw error

      console.log('Bookmark added:', data)

      // Clear form
      setUrl('')
      setTitle('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
      
      // Dispatch event to refresh bookmark list immediately in this tab
      window.dispatchEvent(new CustomEvent('bookmarks:refresh'))
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add bookmark')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Add New Bookmark</h2>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
            URL *
          </label>
          <input
            type="text"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="example.com or https://example.com"
            className="w-full px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            https:// will be added automatically if needed
          </p>
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title (optional)
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="My Bookmark"
            className="w-full px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg flex items-center gap-2">
            <Check className="w-4 h-4" />
            Bookmark added successfully!
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Add Bookmark
        </button>
      </div>
    </form>
  )
}

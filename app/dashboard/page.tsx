import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AddBookmarkForm from '@/components/AddBookmarkForm'
import BookmarkList from '@/components/BookmarkList'
import LogoutButton from '@/components/LogoutButton'
import { BookmarkIcon, User } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Fetch initial bookmarks
  const { data: bookmarksData } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  
  const bookmarks = bookmarksData || []

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <BookmarkIcon className="w-5 h-5 text-blue-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Smart Bookmark</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
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
              <span className="hidden sm:inline">{user.user_metadata?.full_name || user.email}</span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <AddBookmarkForm userId={user.id} />
        
        <BookmarkList 
          initialBookmarks={bookmarks} 
          userId={user.id} 
        />
      </div>
    </main>
  )
}

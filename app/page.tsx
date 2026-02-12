import LoginButton from '@/components/LoginButton'
import { BookmarkIcon } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <BookmarkIcon className="w-8 h-8 text-blue-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Smart Bookmark
          </h1>
          <p className="text-gray-600 mb-8">
            Save, organize, and access your favorite links from anywhere. 
            Real-time sync across all your devices.
          </p>

          <div className="space-y-4">
            <LoginButton />
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Real-time sync
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Google OAuth
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                Private
              </div>
            </div>
          </div>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          Built with Next.js, Supabase & Tailwind CSS
        </p>
      </div>
    </main>
  )
}

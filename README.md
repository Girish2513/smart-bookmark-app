# Smart Bookmark App

A simple bookmark manager with Google OAuth, real-time sync, and private bookmarks per user.

## Live Demo

**Vercel URL:** https://smart-bookmark-app-rcpn.vercel.app

## Features

- ✅ **Google OAuth** - Sign in with Google (no password needed)
- ✅ **Add Bookmarks** - Save URLs with custom titles
- ✅ **Private Bookmarks** - Each user only sees their own bookmarks
- ✅ **Real-time Sync** - Changes appear instantly across all tabs
- ✅ **Delete Bookmarks** - Remove bookmarks you no longer need
- ✅ **URL Validation** - Security checks to prevent XSS attacks
- ✅ **Deployed on Vercel** - Live URL ready for testing

## Tech Stack

- **Next.js 16** - App Router (Server Components)
- **Supabase** - Auth, PostgreSQL Database, Realtime
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety

## Setup Instructions

### 1. Supabase Project Setup

1. Go to [Supabase Dashboard](https://app.supabase.com) and create a new project
2. Wait for the project to be ready
3. Go to **Project Settings > API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` API key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Database Schema

Go to **SQL Editor** in Supabase and run:

```sql
-- Create bookmarks table
CREATE TABLE bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own bookmarks
CREATE POLICY "Users can view own bookmarks" 
  ON bookmarks FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own bookmarks
CREATE POLICY "Users can insert own bookmarks" 
  ON bookmarks FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can delete their own bookmarks
CREATE POLICY "Users can delete own bookmarks" 
  ON bookmarks FOR DELETE 
  USING (auth.uid() = user_id);

-- Enable realtime for bookmarks table
ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;
```

### 3. Google OAuth Setup

1. Go to **Authentication > Providers** in Supabase
2. Enable **Google** provider
3. You'll need to set up Google OAuth credentials:

#### Option A: Using Supabase's Default (Easier, for testing)
- Enable the provider - Supabase provides default credentials for testing

#### Option B: Your Own Google OAuth (Recommended for production)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Go to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth client ID**
5. Configure consent screen (External type for testing)
6. Add these authorized redirect URIs:
   - `https://[YOUR_SUPABASE_REF].supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (for local dev)
7. Copy **Client ID** and **Client Secret** to Supabase Google provider settings

### 4. Local Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local

# Edit .env.local with your Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Deploy on Vercel

1. Push your code to GitHub (make repo public)
2. Go to [Vercel](https://vercel.com) and import your project
3. Add environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

**Important:** Add your Vercel domain to Supabase Auth redirect URLs:
- Go to **Authentication > URL Configuration**
- Add `https://your-app.vercel.app/auth/callback` to Redirect URLs

## Project Structure

```
app/
├── page.tsx                 # Landing page with login
├── dashboard/
│   └── page.tsx             # Main bookmark manager
├── auth/callback/
│   └── route.ts             # OAuth callback handler
├── layout.tsx               # Root layout
└── globals.css              # Global styles

components/
├── LoginButton.tsx          # Google sign-in button
├── LogoutButton.tsx         # Sign out button
├── AddBookmarkForm.tsx      # Form to add bookmarks with validation
├── BookmarkList.tsx         # Real-time bookmark list
├── BookmarkItem.tsx         # Individual bookmark card with XSS protection
└── UserProfile.tsx          # User profile with auto-refresh

lib/supabase/
├── client.ts                # Browser client (realtime)
├── server.ts                # Server client (SSR)
└── middleware.ts            # Auth middleware

types/
└── bookmark.ts              # TypeScript types
```

## How Real-time Works

The app uses Supabase Realtime to sync bookmarks across tabs:

1. When a user adds/deletes a bookmark, it goes to Supabase
2. Supabase broadcasts the change via WebSocket
3. All connected clients receive the update instantly
4. The UI updates without page refresh

This is implemented in `components/BookmarkList.tsx` using:
```typescript
supabase.channel('bookmarks_changes')
  .on('postgres_changes', ...)
  .subscribe()
```

## Security

- **Row Level Security (RLS)** ensures users can only access their own data
- **Google OAuth** handles authentication securely
- **Environment variables** keep secrets out of code
- **Middleware** protects routes based on auth status
- **XSS Prevention**: URLs are validated to block `javascript:`, `data:`, and other dangerous protocols
- **URL Sanitization**: All URLs are checked before rendering as links

## Challenges & Solutions

### Challenge 1: Real-time updates not working
**Problem:** Bookmarks added in one tab didn't appear in another tab automatically.
**Solution:** Had to enable realtime for the bookmarks table in Supabase using `ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;` and ensure the publication was set up correctly.

### Challenge 2: Google OAuth redirect issues
**Problem:** After Google sign-in, users were not redirected correctly back to the app.
**Solution:** Properly configured the callback URL in both Google Cloud Console and Supabase Auth settings. Added `http://localhost:3000/auth/callback` for local dev and the Vercel URL for production.

### Challenge 3: Server vs Client Supabase clients
**Problem:** Next.js 16 App Router requires different Supabase clients for server and browser.
**Solution:** Created separate clients - one for server components (`server.ts`) using `createServerClient` and one for browser (`client.ts`) using `createBrowserClient`.

### Challenge 4: Server Component passing function to Client Component
**Problem:** Got error "Event handlers cannot be passed to Client Component props" because we were passing `onBookmarkAdded` callback from a Server Component to a Client Component.
**Solution:** Made the callback optional and used `window.dispatchEvent` with a custom event to communicate between components instead of passing functions across server/client boundary.

### Challenge 5: User profile not updating when switching accounts
**Problem:** When a user signed out and logged in as a different user in one tab, other tabs still showed the old user's name until refresh.
**Solution:** Created a `UserProfile` client component that listens for auth state changes using `supabase.auth.onAuthStateChange()` and refreshes on tab visibility change.

### Challenge 6: URL validation and XSS prevention
**Problem:** App accepted dangerous URLs like `javascript:alert('xss')` which could lead to XSS attacks.
**Solution:** Implemented URL validation that:
- Blocks dangerous protocols (javascript:, data:, vbscript:, file:, ftp:)
- Auto-adds `https://` if no protocol is provided
- Validates that the domain has a proper TLD (e.g., google.com is valid, google is not)
- Sanitizes URLs on display in BookmarkItem component

### Challenge 7: Input text visibility
**Problem:** Text in URL and Title input fields was not visible (color blending with background).
**Solution:** Added explicit `text-gray-900` and `bg-white` classes to input fields to ensure text is clearly visible.

## Testing Checklist

- [ ] Sign up/log in with Google
- [ ] Add a bookmark with URL and title
- [ ] Add bookmark with just URL (title auto-generated)
- [ ] Try adding invalid URLs (should show error)
- [ ] Try adding `javascript:alert('xss')` (should be blocked)
- [ ] Open two tabs - add bookmark in one, see it appear in other (real-time)
- [ ] Delete a bookmark
- [ ] Sign out and sign in as different user - verify bookmarks are private
- [ ] Verify user name updates when switching accounts

## License

MIT

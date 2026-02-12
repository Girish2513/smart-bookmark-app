# Smart Bookmark App

A simple bookmark manager with Google OAuth, real-time sync, and private bookmarks per user.

## Features

- ✅ **Google OAuth** - Sign in with Google (no password needed)
- ✅ **Add Bookmarks** - Save URLs with custom titles
- ✅ **Private Bookmarks** - Each user only sees their own bookmarks
- ✅ **Real-time Sync** - Changes appear instantly across all tabs
- ✅ **Delete Bookmarks** - Remove bookmarks you no longer need
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
├── AddBookmarkForm.tsx      # Form to add bookmarks
├── BookmarkList.tsx         # Real-time bookmark list
└── BookmarkItem.tsx         # Individual bookmark card

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

## Challenges & Solutions

### Challenge 1: Real-time updates not working
**Solution:** Had to enable realtime for the bookmarks table in Supabase and ensure the publication was set up correctly.

### Challenge 2: Google OAuth redirect issues
**Solution:** Properly configured the callback URL in both Google Cloud Console and Supabase Auth settings.

### Challenge 3: Server vs Client Supabase clients
**Solution:** Created separate clients - one for server components (`server.ts`) using `createServerClient` and one for browser (`client.ts`) using `createBrowserClient`.

## License

MIT

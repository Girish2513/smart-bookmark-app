export interface Bookmark {
  id: string
  user_id: string
  title: string
  url: string
  created_at: string
}

export interface BookmarkInsert {
  user_id: string
  title: string
  url: string
}

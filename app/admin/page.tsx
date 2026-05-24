import { createClient } from '@/lib/supabase/server'
import UserRow from '@/components/admin/user-row'
import PostRow from '@/components/admin/post-row'

type AdminProfileRow = {
  id: string
  display_name: string | null
  role: string | null
  is_banned?: boolean | null
}

type AdminPostRow = {
  id: string
  title: string
  slug: string
  status: string
  author_id: string
  is_featured?: boolean
}

export default async function AdminPage({ searchParams }: { searchParams?: Promise<{ q?: string; role?: string; banned?: string; page?: string; perPage?: string; posts_q?: string; posts_status?: string; posts_page?: string; posts_perPage?: string }> }) {
  const supabase = await createClient()
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const q = (resolvedSearchParams.q || '').trim()
  const roleFilter = resolvedSearchParams.role || ''
  const bannedFilter = resolvedSearchParams.banned || '' // 'true' | 'false' | ''
  const pageNum = Math.max(1, Number(resolvedSearchParams.page || '1'))
  const perPage = Math.max(5, Number(resolvedSearchParams.perPage || '10'))

  // posts-specific params
  const postsQ = (resolvedSearchParams.posts_q || '').trim()
  const postsStatus = resolvedSearchParams.posts_status || ''
  const postsPageNum = Math.max(1, Number(resolvedSearchParams.posts_page || '1'))
  const postsPerPage = Math.max(5, Number(resolvedSearchParams.posts_perPage || String(perPage)))

  const start = (pageNum - 1) * perPage
  const end = pageNum * perPage - 1
  const postsStart = (postsPageNum - 1) * postsPerPage
  const postsEnd = postsPageNum * postsPerPage - 1

  // Build profiles query (server-side search + filters)
  let profilesQuery: any = supabase.from('profiles').select('id, display_name, role, is_banned', { count: 'exact' }).order('created_at', { ascending: true })
  if (q) profilesQuery = profilesQuery.ilike('display_name', `%${q}%`)
  if (roleFilter) profilesQuery = profilesQuery.eq('role', roleFilter)
  if (bannedFilter === 'true') profilesQuery = profilesQuery.eq('is_banned', true)
  if (bannedFilter === 'false') profilesQuery = profilesQuery.eq('is_banned', false)

  // Build posts query (server-side search + pagination)
  let postsQuery: any = supabase.from('posts').select('id, title, slug, status, author_id, is_featured', { count: 'exact' }).order('created_at', { ascending: false })
  if (q) postsQuery = postsQuery.or(`title.ilike.%${q}%,slug.ilike.%${q}%`)

  const profilesRes = await profilesQuery.range(start, end)
  const postsRes = await postsQuery.range(start, end)

  const profiles = profilesRes.data || []
  const posts = postsRes.data || []
  const profilesCount = Number(profilesRes.count ?? 0)
  const postsCount = Number(postsRes.count ?? 0)
  const profilesTotalPages = Math.max(1, Math.ceil(profilesCount / perPage))
  const postsTotalPages = Math.max(1, Math.ceil(postsCount / perPage))

  // helper to build href preserving other params
  function hrefWith(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams()
    for (const [key, value] of Object.entries(resolvedSearchParams)) {
      if (value != null && value !== '') p.set(key, String(value))
    }
    for (const k of Object.keys(overrides)) {
      const v = overrides[k]
      if (v == null || v === '') p.delete(k)
      else p.set(k, v)
    }
    const s = p.toString()
    return s ? `?${s}` : ''
  }

  return (
    <main className="min-h-screen bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 py-10 text-slate-100">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">Admin Dashboard</h1>
          <form method="get" className="flex items-center gap-2">
            <input name="q" defaultValue={q} placeholder="Tìm kiếm..." className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500" />
            <select name="role" defaultValue={roleFilter} className="rounded-md border border-slate-700 bg-slate-800 px-2 py-2 text-sm text-slate-100">
              <option value="">All roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <select name="banned" defaultValue={bannedFilter} className="rounded-md border border-slate-700 bg-slate-800 px-2 py-2 text-sm text-slate-100">
              <option value="">Any</option>
              <option value="false">Not banned</option>
              <option value="true">Banned</option>
            </select>
            <select name="perPage" defaultValue={String(perPage)} className="rounded-md border border-slate-700 bg-slate-800 px-2 py-2 text-sm text-slate-100">
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
            </select>
            <button type="submit" className="rounded-md bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-700">Apply</button>
          </form>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-xl shadow-slate-900/60">
          <h2 className="text-xl font-semibold text-slate-100">Quản lý người dùng</h2>
          <div className="mt-4 divide-y divide-slate-700">
            {profiles?.map((profile: AdminProfileRow) => (
              <UserRow key={profile.id} user={profile} />
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-xl shadow-slate-900/60">
          <h2 className="text-xl font-semibold text-slate-100 mb-4">Quản lý bài viết</h2>

          <form method="get" className="mb-4 flex flex-col sm:flex-row sm:items-center sm:gap-3">
            {/* preserve profile filters as hidden fields */}
            <input type="hidden" name="q" defaultValue={q} />
            <input type="hidden" name="role" defaultValue={roleFilter} />
            <input type="hidden" name="banned" defaultValue={bannedFilter} />

            <input
              name="posts_q"
              defaultValue={postsQ}
              placeholder="Tìm tiêu đề hoặc slug..."
              className="w-full sm:w-64 rounded-md border border-slate-700 bg-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
            />
            <select
              name="posts_status"
              defaultValue={postsStatus}
              className="w-full sm:w-40 mt-2 sm:mt-0 rounded-md border border-slate-700 bg-slate-700 px-2 py-2 text-sm text-slate-100"
            >
              <option value="">Any status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <select
              name="posts_perPage"
              defaultValue={String(postsPerPage)}
              className="w-full sm:w-24 mt-2 sm:mt-0 rounded-md border border-slate-700 bg-slate-700 px-2 py-2 text-sm text-slate-100"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
            </select>
            <div className="mt-2 sm:mt-0">
              <button type="submit" className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700">Tìm</button>
            </div>
          </form>

          <div className="mt-2 divide-y divide-slate-700">
            {posts?.length ? (
              posts.map((post: AdminPostRow) => (
                <PostRow key={post.id} post={post} />
              ))
            ) : (
              <div className="py-4 text-sm text-slate-400">Không tìm thấy bài viết nào</div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-slate-400">{postsCount} bài viết</div>
            <div className="flex items-center gap-2">
              <a href={hrefWith({ posts_page: String(Math.max(1, postsPageNum - 1)) })} className="rounded-md border border-slate-700 px-3 py-1 text-sm text-slate-300 hover:bg-slate-700">Prev</a>
              <div className="text-sm text-slate-300">{postsPageNum} / {Math.max(1, Math.ceil(postsCount / postsPerPage))}</div>
              <a href={hrefWith({ posts_page: String(Math.min(Math.max(1, Math.ceil(postsCount / postsPerPage)), postsPageNum + 1)) })} className="rounded-md border border-slate-700 px-3 py-1 text-sm text-slate-300 hover:bg-slate-700">Next</a>
            </div>
          </div>
        </section>

      </div>
    </main>
  )
}

import { createClient } from '@/lib/supabase/server'
import UserRow from '@/components/admin/user-row'
import PostRow from '@/components/admin/post-row'
import Link from 'next/link'

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
  const bannedFilter = resolvedSearchParams.banned || ''
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

  // Build profiles query
  let profilesQuery: any = supabase.from('profiles').select('id, display_name, role, is_banned', { count: 'exact' }).order('created_at', { ascending: true })
  if (q) profilesQuery = profilesQuery.ilike('display_name', `%${q}%`)
  if (roleFilter) profilesQuery = profilesQuery.eq('role', roleFilter)
  if (bannedFilter === 'true') profilesQuery = profilesQuery.eq('is_banned', true)
  if (bannedFilter === 'false') profilesQuery = profilesQuery.eq('is_banned', false)

  // Build posts query
  let postsQuery: any = supabase.from('posts').select('id, title, slug, status, author_id, is_featured', { count: 'exact' }).order('created_at', { ascending: false })
  if (postsQ) postsQuery = postsQuery.or(`title.ilike.%${postsQ}%,slug.ilike.%${postsQ}%`)
  if (postsStatus) postsQuery = postsQuery.eq('status', postsStatus)

  const profilesRes = await profilesQuery.range(start, end)
  const postsRes = await postsQuery.range(postsStart, postsEnd)

  const profiles = profilesRes.data || []
  const posts = postsRes.data || []
  const profilesCount = Number(profilesRes.count ?? 0)
  const postsCount = Number(postsRes.count ?? 0)
  const profilesTotalPages = Math.max(1, Math.ceil(profilesCount / perPage))
  const postsTotalPages = Math.max(1, Math.ceil(postsCount / postsPerPage))

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
    <main className="min-h-screen relative pb-20" style={{ background: '#020617' }}>
      {/* Ambient background orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-[20%] left-[-10%] w-[600px] h-[400px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #ef4444 0%, transparent 70%)', filter: 'blur(100px)' }} />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-12">
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#fcd34d' }}>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5 animate-pulse" />
                Admin Panel
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight" style={{ color: '#f1f5f9' }}>
              Dashboard
            </h1>
            <p className="mt-3 text-sm" style={{ color: '#94a3b8' }}>
              Quản lý toàn bộ người dùng và bài viết trên hệ thống.
            </p>
          </div>

          <div className="flex gap-4">
            <div className="px-5 py-3 rounded-2xl flex flex-col items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-2xl font-black" style={{ color: '#f1f5f9' }}>{profilesCount}</span>
              <span className="text-xs uppercase tracking-wider" style={{ color: '#64748b' }}>Users</span>
            </div>
            <div className="px-5 py-3 rounded-2xl flex flex-col items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-2xl font-black" style={{ color: '#f1f5f9' }}>{postsCount}</span>
              <span className="text-xs uppercase tracking-wider" style={{ color: '#64748b' }}>Posts</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* ── QUẢN LÝ NGƯỜI DÙNG ──────────────────────────────────── */}
          <section className="flex flex-col">
            <div className="rounded-3xl overflow-hidden flex-1 flex flex-col"
              style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
              <div className="p-6 border-b border-white/5">
                <h2 className="text-xl font-bold flex items-center gap-2 mb-4" style={{ color: '#f1f5f9' }}>
                  <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Quản lý người dùng
                </h2>
                
                <form method="get" className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input name="q" defaultValue={q} placeholder="Tìm người dùng..." 
                      className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none transition-all focus:border-indigo-500/50"
                      style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9' }} />
                  </div>
                  <select name="role" defaultValue={roleFilter} 
                    className="rounded-xl px-3 py-2 text-sm outline-none cursor-pointer"
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', color: '#cbd5e1' }}>
                    <option value="">All roles</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  <select name="banned" defaultValue={bannedFilter} 
                    className="rounded-xl px-3 py-2 text-sm outline-none cursor-pointer"
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', color: '#cbd5e1' }}>
                    <option value="">Status</option>
                    <option value="false">Active</option>
                    <option value="true">Banned</option>
                  </select>
                  <button type="submit" className="rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:bg-white/10"
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#f1f5f9' }}>
                    Lọc
                  </button>
                </form>
              </div>

              <div className="flex-1 p-4 overflow-y-auto" style={{ maxHeight: '600px' }}>
                <div className="space-y-2">
                  {profiles?.length ? profiles.map((profile: AdminProfileRow) => (
                    <UserRow key={profile.id} user={profile} />
                  )) : (
                    <div className="text-center py-10 text-sm text-slate-500">Không tìm thấy người dùng.</div>
                  )}
                </div>
              </div>

              {profilesTotalPages > 1 && (
                <div className="p-4 border-t border-white/5 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.2)' }}>
                  <span className="text-xs text-slate-500">Page {pageNum} of {profilesTotalPages}</span>
                  <div className="flex items-center gap-2">
                    <a href={hrefWith({ page: String(Math.max(1, pageNum - 1)) })} 
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${pageNum <= 1 ? 'pointer-events-none opacity-50' : 'hover:bg-white/5'}`}
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#cbd5e1' }}>Trang trước</a>
                    <a href={hrefWith({ page: String(Math.min(profilesTotalPages, pageNum + 1)) })} 
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${pageNum >= profilesTotalPages ? 'pointer-events-none opacity-50' : 'hover:bg-white/5'}`}
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#cbd5e1' }}>Trang sau</a>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── QUẢN LÝ BÀI VIẾT ────────────────────────────────────── */}
          <section className="flex flex-col">
            <div className="rounded-3xl overflow-hidden flex-1 flex flex-col"
              style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
              <div className="p-6 border-b border-white/5">
                <h2 className="text-xl font-bold flex items-center gap-2 mb-4" style={{ color: '#f1f5f9' }}>
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" />
                  </svg>
                  Quản lý bài viết
                </h2>
                
                <form method="get" className="flex flex-wrap items-center gap-3">
                  <input type="hidden" name="q" defaultValue={q} />
                  <input type="hidden" name="role" defaultValue={roleFilter} />
                  <input type="hidden" name="banned" defaultValue={bannedFilter} />
                  <input type="hidden" name="page" defaultValue={pageNum} />

                  <div className="relative flex-1 min-w-[200px]">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input name="posts_q" defaultValue={postsQ} placeholder="Tìm bài viết..." 
                      className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none transition-all focus:border-amber-500/50"
                      style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9' }} />
                  </div>
                  <select name="posts_status" defaultValue={postsStatus} 
                    className="rounded-xl px-3 py-2 text-sm outline-none cursor-pointer"
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', color: '#cbd5e1' }}>
                    <option value="">All status</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                  <button type="submit" className="rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:bg-white/10"
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#f1f5f9' }}>
                    Lọc
                  </button>
                </form>
              </div>

              <div className="flex-1 p-4 overflow-y-auto" style={{ maxHeight: '600px' }}>
                <div className="space-y-2">
                  {posts?.length ? posts.map((post: AdminPostRow) => (
                    <PostRow key={post.id} post={post} />
                  )) : (
                    <div className="text-center py-10 text-sm text-slate-500">Không tìm thấy bài viết.</div>
                  )}
                </div>
              </div>

              {postsTotalPages > 1 && (
                <div className="p-4 border-t border-white/5 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.2)' }}>
                  <span className="text-xs text-slate-500">Page {postsPageNum} of {postsTotalPages}</span>
                  <div className="flex items-center gap-2">
                    <a href={hrefWith({ posts_page: String(Math.max(1, postsPageNum - 1)) })} 
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${postsPageNum <= 1 ? 'pointer-events-none opacity-50' : 'hover:bg-white/5'}`}
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#cbd5e1' }}>Trang trước</a>
                    <a href={hrefWith({ posts_page: String(Math.min(postsTotalPages, postsPageNum + 1)) })} 
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${postsPageNum >= postsTotalPages ? 'pointer-events-none opacity-50' : 'hover:bg-white/5'}`}
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#cbd5e1' }}>Trang sau</a>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

      </div>
    </main>
  )
}

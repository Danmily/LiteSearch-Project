import { useEffect, useState } from 'react'
import ArrangementView, { type Snapshot } from './ArrangementView'
import { NICKNAME_KEY } from './Studio'

const API_BASE = 'http://localhost:8000'

interface PostSummary {
  id: number
  nickname: string
  caption: string
  snapshot: Snapshot
  created_at: string
  like_count: number
  comment_count: number
  liked_by_me: boolean
}

interface Comment {
  id: number
  nickname: string
  body: string
  created_at: string
}

interface PostDetail extends PostSummary {
  comments: Comment[]
}

function formatWhen(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString()
}

export default function Gallery({ initialPostId }: { initialPostId?: number | null }) {
  const [nickname, setNickname] = useState(() => localStorage.getItem(NICKNAME_KEY) ?? '')
  const [nicknameDraft, setNicknameDraft] = useState('')
  const [sort, setSort] = useState<'new' | 'top'>('new')
  const [posts, setPosts] = useState<PostSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedId, setSelectedId] = useState<number | null>(initialPostId ?? null)
  const [detail, setDetail] = useState<PostDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [commentDraft, setCommentDraft] = useState('')
  const [commentBusy, setCommentBusy] = useState(false)

  function saveNickname() {
    const n = nicknameDraft.trim()
    if (!n) return
    localStorage.setItem(NICKNAME_KEY, n)
    setNickname(n)
    setNicknameDraft('')
  }

  async function loadPosts() {
    setLoading(true)
    setError(null)
    try {
      const url = new URL('/gallery/posts', API_BASE)
      url.searchParams.set('sort', sort)
      if (nickname) url.searchParams.set('viewer', nickname)
      const res = await fetch(url)
      if (!res.ok) throw new Error(`请求失败: ${res.status}`)
      const data = await res.json()
      setPosts(data.posts)
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }

  async function loadDetail(id: number) {
    setDetailLoading(true)
    setError(null)
    try {
      const url = new URL(`/gallery/posts/${id}`, API_BASE)
      if (nickname) url.searchParams.set('viewer', nickname)
      const res = await fetch(url)
      if (!res.ok) throw new Error(`请求失败: ${res.status}`)
      setDetail(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setDetailLoading(false)
    }
  }

  useEffect(() => {
    if (selectedId == null) loadPosts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, selectedId])

  useEffect(() => {
    if (selectedId != null) loadDetail(selectedId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  async function toggleLike() {
    if (!detail || !nickname) return
    const optimistic = { ...detail, liked_by_me: !detail.liked_by_me, like_count: detail.like_count + (detail.liked_by_me ? -1 : 1) }
    setDetail(optimistic)
    try {
      const res = await fetch(new URL(`/gallery/posts/${detail.id}/like`, API_BASE), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname }),
      })
      if (!res.ok) throw new Error(`请求失败: ${res.status}`)
      const data = await res.json()
      setDetail((d) => (d ? { ...d, liked_by_me: data.liked, like_count: data.like_count } : d))
    } catch {
      setDetail(detail) // roll back
    }
  }

  async function submitComment() {
    if (!detail || !nickname || !commentDraft.trim() || commentBusy) return
    setCommentBusy(true)
    try {
      const res = await fetch(new URL(`/gallery/posts/${detail.id}/comments`, API_BASE), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, body: commentDraft.trim() }),
      })
      if (!res.ok) throw new Error(`请求失败: ${res.status}`)
      const comment = await res.json()
      setDetail((d) => (d ? { ...d, comments: [...d.comments, comment], comment_count: d.comment_count + 1 } : d))
      setCommentDraft('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setCommentBusy(false)
    }
  }

  function openPost(id: number) {
    setSelectedId(id)
  }

  function backToList() {
    setSelectedId(null)
    setDetail(null)
    // drop the ?post= param so a refresh doesn't keep jumping back here
    const url = new URL(window.location.href)
    url.searchParams.delete('post')
    window.history.replaceState({}, '', url.toString())
  }

  return (
    <div className="gallery">
      <p className="studio-hint">在插花工坊搭一瓶花,点「发布到集市」就能出现在这里 · 大家的花束都能点赞、评论</p>

      {!nickname && (
        <div className="publish-fields nickname-gate">
          <input
            type="text"
            className="publish-input"
            placeholder="先起个昵称才能点赞/评论"
            value={nicknameDraft}
            onChange={(e) => setNicknameDraft(e.target.value)}
            maxLength={24}
          />
          <button type="button" className="ink-btn" onClick={saveNickname} disabled={!nicknameDraft.trim()}>
            记住昵称
          </button>
        </div>
      )}
      {nickname && <p className="hint">当前昵称:{nickname}</p>}

      {error && <p className="error">出错了: {error}</p>}

      {selectedId == null ? (
        <>
          <div className="theme-bar">
            <span className="theme-bar-label">排序</span>
            <button type="button" className={sort === 'new' ? 'theme-chip on' : 'theme-chip'} onClick={() => setSort('new')}>最新</button>
            <button type="button" className={sort === 'top' ? 'theme-chip on' : 'theme-chip'} onClick={() => setSort('top')}>最热</button>
          </div>

          {loading && <p className="hint">加载中…</p>}
          {!loading && posts.length === 0 && !error && <p className="hint">集市还空着,来发第一束花吧</p>}

          <ul className="gallery-grid">
            {posts.map((p) => (
              <li key={p.id} className="card gallery-card" onClick={() => openPost(p.id)}>
                <div className="gallery-thumb"><ArrangementView snapshot={p.snapshot} /></div>
                <div className="card-index">{p.nickname} · {formatWhen(p.created_at)}</div>
                {p.caption && <p className="card-body">{p.caption}</p>}
                <p className="card-meta">
                  <span className={p.liked_by_me ? 'badge-pass' : ''}>♥ {p.like_count}</span>
                  <span>💬 {p.comment_count}</span>
                </p>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <button type="button" className="ink-btn ghost" onClick={backToList}>← 回集市</button>
          {detailLoading && <p className="hint">加载中…</p>}
          {detail && (
            <div className="gallery-detail">
              <div className="gallery-detail-scene"><ArrangementView snapshot={detail.snapshot} /></div>
              <div className="card-index">{detail.nickname} · {formatWhen(detail.created_at)}</div>
              {detail.caption && <p className="card-body">{detail.caption}</p>}

              <div className="gallery-actions">
                <button
                  type="button"
                  className={detail.liked_by_me ? 'ink-btn' : 'ink-btn ghost'}
                  onClick={toggleLike}
                  disabled={!nickname}
                  title={nickname ? undefined : '先起个昵称才能点赞'}
                >
                  ♥ {detail.like_count}
                </button>
              </div>

              <h2 className="section-label">评论 {detail.comment_count}</h2>
              <ul className="agent-step-list gallery-comments">
                {detail.comments.map((c) => (
                  <li key={c.id} className="agent-step">
                    <span className="agent-step-role">{c.nickname}</span>
                    <span className="agent-step-text">{c.body}</span>
                  </li>
                ))}
                {detail.comments.length === 0 && <p className="hint">还没有评论,来说第一句吧</p>}
              </ul>

              {nickname ? (
                <div className="publish-fields">
                  <input
                    type="text"
                    className="publish-input"
                    placeholder="说点什么…"
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value)}
                    maxLength={500}
                  />
                  <button type="button" className="ink-btn" onClick={submitComment} disabled={!commentDraft.trim() || commentBusy}>
                    {commentBusy ? '发送中…' : '发送'}
                  </button>
                </div>
              ) : (
                <p className="hint">先起个昵称才能评论</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

import { useState, type FormEvent } from 'react'
import './App.css'

const API_BASE = 'http://localhost:8000'

interface SearchResult {
  doc_id: string
  source_path: string
  text: string
  score: number
}

interface FlowerCard {
  name: string
  huayu: string
  body: string
  score?: number
}

function parseFlower(text: string, score?: number): FlowerCard {
  const nameMatch = text.match(/^#\s*(.+)/m)
  const huayuMatch = text.match(/\*\*花语\*\*[:：]\s*(.+)/)
  const body = text
    .replace(/^#\s*.+$/m, '')
    .replace(/^\*\*花语\*\*[:：].+$/m, '')
    .replace(/\*\*(.+?)\*\*[:：]?/g, '$1:')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return {
    name: nameMatch?.[1]?.trim() ?? '未知花材',
    huayu: huayuMatch?.[1]?.trim() ?? '',
    body,
    score,
  }
}

function FlowerGrid({ cards }: { cards: FlowerCard[] }) {
  return (
    <ul className="flower-grid">
      {cards.map((f) => (
        <li key={f.name} className="flower-card">
          <div className="flower-card-head">
            <span className="flower-name">{f.name}</span>
            {f.score !== undefined && (
              <span className="flower-score">匹配 {(f.score * 100).toFixed(0)}%</span>
            )}
          </div>
          {f.huayu && <p className="flower-huayu">「{f.huayu}」</p>}
          <p className="flower-body">{f.body}</p>
        </li>
      ))}
    </ul>
  )
}

function App() {
  const [tab, setTab] = useState<'recommend' | 'search'>('recommend')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [recommendation, setRecommendation] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<FlowerCard[]>([])
  const [searchResults, setSearchResults] = useState<FlowerCard[]>([])
  const [searchedFor, setSearchedFor] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!query.trim() || loading) return

    setLoading(true)
    setError(null)
    try {
      const path = tab === 'recommend' ? '/recommend' : '/search'
      const url = new URL(path, API_BASE)
      url.searchParams.set('q', query)
      const res = await fetch(url)
      if (!res.ok) throw new Error(`请求失败: ${res.status}`)
      const data = await res.json()
      if (tab === 'recommend') {
        setRecommendation(data.recommendation)
        setCandidates(
          data.candidates.map((r: SearchResult) => parseFlower(r.text, r.score)),
        )
      } else {
        setSearchResults(
          data.results.map((r: SearchResult) => parseFlower(r.text, r.score)),
        )
        setSearchedFor(data.query)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }

  const placeholder =
    tab === 'recommend'
      ? '说说你的需求,比如:朋友考研失败了,想送束花鼓励她…'
      : '搜索花卉,比如:适合放办公桌的小花'

  return (
    <div className="page">
      <header className="masthead">
        <h1>花语集</h1>
        <p className="subtitle">告诉我场合与心意,为你选一束合适的花</p>
      </header>

      <nav className="tabs">
        <button
          type="button"
          className={tab === 'recommend' ? 'tab active' : 'tab'}
          onClick={() => setTab('recommend')}
        >
          推荐花束
        </button>
        <button
          type="button"
          className={tab === 'search' ? 'tab active' : 'tab'}
          onClick={() => setTab('search')}
        >
          搜索花卉
        </button>
      </nav>

      <form className="search-bar" onSubmit={submit}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
        />
        <button type="submit" disabled={loading}>
          {loading ? (tab === 'recommend' ? '挑选中…' : '搜索中…') : tab === 'recommend' ? '为我推荐' : '搜索'}
        </button>
      </form>

      {loading && tab === 'recommend' && (
        <p className="hint">花艺师正在从花房里为你挑选,本地模型生成约需几秒…</p>
      )}
      {error && <p className="error">出错了: {error}</p>}

      {tab === 'recommend' && !loading && recommendation && (
        <>
          <section className="recommendation">
            <h2>花艺师的推荐</h2>
            <p>{recommendation}</p>
          </section>
          <h3 className="section-label">依据这些候选花材</h3>
          <FlowerGrid cards={candidates} />
        </>
      )}

      {tab === 'search' && searchedFor !== null && !error && (
        <>
          <p className="result-count">
            “{searchedFor}” 共 {searchResults.length} 条结果
          </p>
          <FlowerGrid cards={searchResults} />
        </>
      )}
    </div>
  )
}

export default App

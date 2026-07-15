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
  latin: string
  family: string
  huayu: string
  scenes: string
  colors: string
  season: string
  body: string
  score?: number
  isKnowledge: boolean
}

function pick(text: string, label: string): string {
  const m = text.match(new RegExp(`\\*\\*${label}\\*\\*[:：]\\s*(.+)`))
  return m?.[1]?.replace(/\*/g, '').trim() ?? ''
}

function parseCard(r: SearchResult): FlowerCard {
  const text = r.text
  const nameMatch = text.match(/^#\s*(.+)/m)
  const fallback = r.source_path.split('/').pop()?.replace('.md', '') ?? '未命名'
  const body = text
    .replace(/^#\s*.+$/m, '')
    .replace(/^\*\*(学名|科属|花语|适合场景|颜色|花期)\*\*[:：].*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return {
    name: nameMatch?.[1]?.trim() ?? fallback,
    latin: pick(text, '学名'),
    family: pick(text, '科属'),
    huayu: pick(text, '花语'),
    scenes: pick(text, '适合场景'),
    colors: pick(text, '颜色'),
    season: pick(text, '花期'),
    body,
    score: r.score,
    isKnowledge: r.source_path.includes('/knowledge/'),
  }
}

function FlowerGrid({ cards }: { cards: FlowerCard[] }) {
  return (
    <ul className="grid">
      {cards.map((f, i) => (
        <li key={f.name} className={f.isKnowledge ? 'card knowledge' : 'card'}>
          <div className="card-index">{f.isKnowledge ? '花艺手册' : `No.${String(i + 1).padStart(2, '0')}`}</div>
          <h3 className="card-name">{f.name}</h3>
          {f.latin && <p className="card-latin">{f.latin}{f.family ? ` · ${f.family}` : ''}</p>}
          {f.huayu && <p className="card-huayu">{f.huayu}</p>}
          {(f.colors || f.season) && (
            <p className="card-meta">
              {f.colors && <span>色 {f.colors}</span>}
              {f.season && <span>期 {f.season}</span>}
            </p>
          )}
          {f.scenes && <p className="card-meta"><span>宜 {f.scenes}</span></p>}
          <p className="card-body">{f.body}</p>
          {f.score !== undefined && (
            <div className="card-score">匹配 {(f.score * 100).toFixed(0)}%</div>
          )}
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
        setCandidates(data.candidates.map(parseCard))
      } else {
        setSearchResults(data.results.map(parseCard))
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
      ? '说说场合与心意:朋友乔迁新居,想送一束耐放又大方的花…'
      : '找一种花:香气好的 / 适合探病 / 花语关于告别…'

  return (
    <div className="page">
      <header className="masthead">
        <div className="masthead-rule" />
        <h1>花语集</h1>
        <p className="masthead-latin">FLORILEGIUM</p>
        <p className="subtitle">二十五种常见花材 · 花语溯源 · 花艺师推荐</p>
        <div className="masthead-rule" />
      </header>

      <nav className="tabs">
        <button
          type="button"
          className={tab === 'recommend' ? 'tab active' : 'tab'}
          onClick={() => setTab('recommend')}
        >
          花束推荐
        </button>
        <span className="tab-divider">/</span>
        <button
          type="button"
          className={tab === 'search' ? 'tab active' : 'tab'}
          onClick={() => setTab('search')}
        >
          图鉴检索
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
          {loading ? '…' : tab === 'recommend' ? '为我配一束' : '检索'}
        </button>
      </form>

      {loading && tab === 'recommend' && (
        <p className="hint">花艺师正在配花,本地模型生成约需几秒</p>
      )}
      {error && <p className="error">出错了: {error}</p>}

      {tab === 'recommend' && !loading && recommendation && (
        <>
          <section className="note">
            <div className="note-label">花艺师手记</div>
            <p className="note-text">{recommendation}</p>
          </section>
          <h2 className="section-label">本次配花参考的花材</h2>
          <FlowerGrid cards={candidates} />
        </>
      )}

      {tab === 'search' && searchedFor !== null && !error && (
        <>
          <p className="result-count">
            “{searchedFor}” · {searchResults.length} 条
          </p>
          <FlowerGrid cards={searchResults} />
        </>
      )}

      <footer className="colophon">
        花语参考维多利亚花语传统(Latour 1819 / Tyas 1840s,公有领域)与中文常见习俗整理 ·
        花艺原则参考 AIFD 十项评估与 60-30-10 法则 · 内容为演示语料
      </footer>
    </div>
  )
}

export default App

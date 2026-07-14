import { useState, type FormEvent } from 'react'
import './App.css'

const API_BASE = 'http://localhost:8000'

interface SearchResult {
  doc_id: string
  source_path: string
  text: string
  score: number
}

function App() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchedFor, setSearchedFor] = useState<string | null>(null)

  async function runSearch(e: FormEvent) {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError(null)
    try {
      const url = new URL('/search', API_BASE)
      url.searchParams.set('q', query)
      const res = await fetch(url)
      if (!res.ok) throw new Error(`请求失败: ${res.status}`)
      const data = await res.json()
      setResults(data.results)
      setSearchedFor(data.query)
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <h1>LiteSearch</h1>
      <p className="subtitle">个人知识库语义搜索</p>

      <form className="search-bar" onSubmit={runSearch}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索你的笔记…"
        />
        <button type="submit" disabled={loading}>
          {loading ? '搜索中…' : '搜索'}
        </button>
      </form>

      {error && <p className="error">出错了: {error}</p>}

      {searchedFor !== null && !error && (
        <p className="result-count">
          “{searchedFor}” 共 {results.length} 条结果
        </p>
      )}

      <ul className="results">
        {results.map((r) => (
          <li key={r.doc_id} className="result-card">
            <div className="result-header">
              <span className="source-path">{r.source_path}</span>
              <span className="score">相关度 {r.score.toFixed(3)}</span>
            </div>
            <p className="result-text">{r.text}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App

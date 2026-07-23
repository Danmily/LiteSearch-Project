import { useState, type FormEvent } from 'react'

const API_BASE = 'http://localhost:8000'

type Agent = 'planner' | 'composer' | 'verifier'

interface StepEvent {
  type: 'step'
  agent: Agent
  summary: string
  subtask_index?: number
  attempt?: number
  check?: 'grounding' | 'judge'
  passed?: boolean
  subtasks?: string[]
}

interface ResultEvent {
  type: 'result'
  subtask_index: number
  brief: string
  name: string
  blurb: string
  flowers: string[]
  grounded: boolean
  judge_passed: boolean | null
  attempts: number
}

interface DoneEvent {
  type: 'done'
  truncated: boolean
}

type PlanEvent = StepEvent | ResultEvent | DoneEvent

const ROLE_LABEL: Record<Agent, string> = {
  planner: '策划师',
  composer: '花艺师',
  verifier: '校验师',
}

function StepLine({ step }: { step: StepEvent }) {
  const label = ROLE_LABEL[step.agent]
  const where = step.subtask_index ? `子任务${step.subtask_index} · ` : ''
  const checkLabel = step.check === 'grounding' ? '花材核对 · ' : step.check === 'judge' ? '语气复核 · ' : ''
  const badge =
    step.passed === true ? <span className="badge-pass">✓</span> : step.passed === false ? <span className="badge-flag">!</span> : null

  return (
    <li className="agent-step">
      <span className="agent-step-role">{label}</span>
      <span className="agent-step-text">
        {where}
        {checkLabel}
        {step.summary}
      </span>
      {badge}
      {step.subtasks && (
        <ul className="agent-step-sublist">
          {step.subtasks.map((s, i) => (
            <li key={i}>子任务{i + 1}:{s}</li>
          ))}
        </ul>
      )}
    </li>
  )
}

export default function ComplexRequest() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [steps, setSteps] = useState<StepEvent[]>([])
  const [results, setResults] = useState<ResultEvent[]>([])
  const [truncated, setTruncated] = useState(false)
  const [started, setStarted] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!query.trim() || loading) return

    setLoading(true)
    setStarted(true)
    setError(null)
    setSteps([])
    setResults([])
    setTruncated(false)

    try {
      const url = new URL('/plan', API_BASE)
      url.searchParams.set('q', query)
      const res = await fetch(url)
      if (!res.ok || !res.body) throw new Error(`请求失败: ${res.status}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.trim()) continue
          const evt = JSON.parse(line) as PlanEvent
          if (evt.type === 'step') setSteps((s) => [...s, evt])
          else if (evt.type === 'result') setResults((r) => [...r, evt])
          else if (evt.type === 'done') setTruncated(evt.truncated)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="complex">
      <p className="studio-hint">
        一次说清收件人、场合、心意甚至预算——策划师拆解需求,花艺师配花,校验师核对花材是否真实存在、语气是否贴题
      </p>

      <form className="search-bar" onSubmit={submit}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="比如:给妈妈和女朋友各配一束不同风格的花,预算共500元"
        />
        <button type="submit" disabled={loading}>
          {loading ? '协作中…' : '开始协作设计'}
        </button>
      </form>

      {loading && (
        <p className="hint">三个 Agent 正在接力工作,复杂需求可能要 20-30 秒,过程会实时显示在下面</p>
      )}
      {error && <p className="error">出错了: {error}</p>}

      {started && steps.length > 0 && (
        <section className="note agent-log">
          <div className="note-label">协作过程</div>
          <ul className="agent-step-list">
            {steps.map((s, i) => (
              <StepLine key={i} step={s} />
            ))}
          </ul>
        </section>
      )}

      {results.length > 0 && (
        <>
          <h2 className="section-label">配好的花束</h2>
          {truncated && <p className="hint">需求拆出的子任务较多,已只处理前几个</p>}
          <ul className="grid">
            {results.map((r) => (
              <li key={r.subtask_index} className="card">
                <div className="card-index">子任务 {r.subtask_index}</div>
                <p className="card-meta"><span>{r.brief}</span></p>
                <h3 className="card-name">{r.name}</h3>
                <p className="card-body">{r.blurb}</p>
                {r.flowers.length > 0 && (
                  <p className="card-meta"><span>花材 {r.flowers.join('、')}</span></p>
                )}
                <p className="card-meta">
                  <span className={r.grounded ? 'badge-pass' : 'badge-flag'}>
                    {r.grounded ? `✓ 花材已核对(第 ${r.attempts} 次通过)` : '! 已改用保底方案'}
                  </span>
                  {r.judge_passed === false && <span className="badge-flag">! 语气建议关注</span>}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

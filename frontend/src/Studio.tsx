import { useEffect, useRef, useState, type PointerEvent } from 'react'

const API_BASE = 'http://localhost:8000'
const INK = '#4a4238'

type Kind =
  | 'rose'
  | 'tulip'
  | 'sunflower'
  | 'daisy'
  | 'hydrangea'
  | 'gypsophila'
  | 'lily'
  | 'eucalyptus'

interface FlowerDef {
  label: string
  huayu: string
  palette: string[]
}

export const FLOWER_DEFS: Record<Kind, FlowerDef> = {
  rose: {
    label: '玫瑰', huayu: '热烈的爱、温柔的告白',
    palette: ['#e59aae', '#cf5b76', '#f2d3da', '#efe3c4', '#b8405f'],
  },
  tulip: {
    label: '郁金香', huayu: '博爱、体贴、优雅',
    palette: ['#e0719b', '#e6b23a', '#b184c9', '#dd6a52', '#f3ecd8'],
  },
  sunflower: {
    label: '向日葵', huayu: '阳光、沉默的爱',
    palette: ['#f2b31f', '#e8930c', '#f6c95c'],
  },
  daisy: {
    label: '小雏菊', huayu: '隐藏在心底的爱、天真快乐',
    palette: ['#f7f3ea', '#f3c6d3', '#f4de79'],
  },
  hydrangea: {
    label: '绣球', huayu: '希望、圆满、感谢你的理解',
    palette: ['#9db8dd', '#d8a9c4', '#b9cf9e', '#cfc3e6'],
  },
  gypsophila: {
    label: '满天星', huayu: '思念、甘愿做配角的爱',
    palette: ['#f7f4ec', '#f3d9e2', '#dce6f4'],
  },
  lily: {
    label: '百合', huayu: '纯洁、百年好合',
    palette: ['#f5f0e2', '#f0c8d8', '#f2dc9b'],
  },
  eucalyptus: {
    label: '尤加利', huayu: '恩赐、守护、回忆',
    palette: ['#9caf88', '#7e9a72', '#b5c4a1'],
  },
}

const VASE_COLORS = ['#c67d54', '#7c93a8', '#5b7d64', '#d9c07a', '#8a6b9e']

/* ---------- hand-drawn blooms, centred on (0,0) ---------- */

export function Bloom({ kind, color }: { kind: Kind; color: string }) {
  const s = { stroke: INK, strokeWidth: 2, strokeLinecap: 'round' as const }
  switch (kind) {
    case 'rose':
      return (
        <g>
          <ellipse cx="-16" cy="4" rx="11" ry="9" fill={color} {...s} transform="rotate(-24 -16 4)" />
          <ellipse cx="16" cy="4" rx="11" ry="9" fill={color} {...s} transform="rotate(24 16 4)" />
          <circle r="19" fill={color} {...s} />
          <path d="M0,-12 C10,-10 12,2 3,7 C-5,11 -12,4 -7,-3 C-3,-8 4,-7 4,-1" fill="none" {...s} />
        </g>
      )
    case 'tulip':
      return (
        <g>
          <path d="M-18,-4 C-21,-24 -9,-30 0,-17 C9,-30 21,-24 18,-4 C16,12 -16,12 -18,-4 Z" fill={color} {...s} />
          <path d="M-7,-15 C-6,-27 6,-27 7,-15" fill="none" {...s} />
        </g>
      )
    case 'sunflower':
      return (
        <g>
          {Array.from({ length: 12 }, (_, k) => (
            <ellipse key={k} cx="0" cy="-21" rx="6" ry="12" fill={color} {...s}
              transform={`rotate(${k * 30})`} />
          ))}
          <circle r="12" fill="#7a5230" {...s} />
          <circle cx="-4" cy="-2" r="1.3" fill={INK} stroke="none" />
          <circle cx="3" cy="3" r="1.3" fill={INK} stroke="none" />
          <circle cx="4" cy="-4" r="1.3" fill={INK} stroke="none" />
          <circle cx="-2" cy="5" r="1.3" fill={INK} stroke="none" />
        </g>
      )
    case 'daisy':
      return (
        <g>
          {Array.from({ length: 11 }, (_, k) => (
            <ellipse key={k} cx="0" cy="-16" rx="4.5" ry="11" fill={color} {...s}
              transform={`rotate(${k * 32.7})`} />
          ))}
          <circle r="8" fill="#f2c14e" {...s} />
        </g>
      )
    case 'hydrangea': {
      const spots: [number, number][] = [[0, -12], [-14, -2], [14, -2], [-7, 10], [8, 10]]
      return (
        <g>
          {spots.map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y})`}>
              {[0, 90, 180, 270].map((r) => (
                <ellipse key={r} cx="0" cy="-5.5" rx="4.5" ry="5.5" fill={color} {...s}
                  strokeWidth="1.6" transform={`rotate(${r + (i * 17) % 40})`} />
              ))}
              <circle r="1.6" fill={INK} stroke="none" />
            </g>
          ))}
        </g>
      )
    }
    case 'gypsophila':
      return (
        <g>
          <path d="M0,22 C-4,8 -12,0 -16,-10 M0,22 C0,8 1,-4 0,-16 M0,22 C5,10 12,2 15,-7"
            fill="none" {...s} strokeWidth="1.6" />
          {([[-16, -12], [0, -18], [15, -9], [-9, -2], [8, 0], [-3, -9]] as [number, number][]).map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="4" fill={color} {...s} strokeWidth="1.6" />
          ))}
        </g>
      )
    case 'lily':
      return (
        <g>
          {Array.from({ length: 6 }, (_, k) => (
            <path key={k} d="M0,2 C7,-8 8,-22 0,-29 C-8,-22 -7,-8 0,2 Z" fill={color} {...s}
              transform={`rotate(${k * 60})`} />
          ))}
          <path d="M-4,-2 L-7,-13 M0,0 L0,-14 M4,-2 L7,-13" fill="none" {...s} strokeWidth="1.4" />
          <circle cx="-7" cy="-14" r="2" fill="#c98a2d" stroke="none" />
          <circle cx="0" cy="-15" r="2" fill="#c98a2d" stroke="none" />
          <circle cx="7" cy="-14" r="2" fill="#c98a2d" stroke="none" />
        </g>
      )
    case 'eucalyptus':
      return (
        <g>
          <path d="M0,26 C-2,8 2,-10 0,-26" fill="none" {...s} />
          {([[-8, 16], [8, 8], [-9, 0], [8, -8], [-8, -16], [6, -22]] as [number, number][]).map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="7" fill={color} {...s} strokeWidth="1.6" />
          ))}
        </g>
      )
  }
}

/* ---------- studio ---------- */

interface Placed {
  id: number
  kind: Kind
  colorIdx: number
  ax: number
  ay: number
  x: number
  y: number
  swayDur: number
  swayDelay: number
}

interface Note {
  key: number
  label: string
  huayu: string
}

const STORAGE_KEY = 'huayuji-arrangement-v1'

let nextId = 1

export default function Studio() {
  const [placed, setPlaced] = useState<Placed[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const arr = JSON.parse(saved) as Placed[]
        nextId = Math.max(0, ...arr.map((p) => p.id)) + 1
        return arr
      }
    } catch { /* fresh table */ }
    return []
  })
  const [vaseIdx, setVaseIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [note, setNote] = useState<Note | null>(null)
  const [critique, setCritique] = useState<string | null>(null)
  const [critiqueLoading, setCritiqueLoading] = useState(false)
  const [petalRain, setPetalRain] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const dragRef = useRef<{ id: number; moved: boolean } | null>(null)
  const noteTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(placed))
  }, [placed])

  function showNote(kind: Kind) {
    const def = FLOWER_DEFS[kind]
    clearTimeout(noteTimer.current)
    setNote({ key: Date.now(), label: def.label, huayu: def.huayu })
    noteTimer.current = setTimeout(() => setNote(null), 4200)
  }

  function addFlower(kind: Kind) {
    if (placed.length >= 12) return
    const ax = 348 + Math.random() * 64
    const x = 250 + Math.random() * 260
    const y = 130 + Math.random() * 130
    const flower: Placed = {
      id: nextId++,
      kind,
      colorIdx: Math.floor(Math.random() * FLOWER_DEFS[kind].palette.length),
      ax, ay: 368, x, y,
      swayDur: 3.4 + Math.random() * 2.2,
      swayDelay: -Math.random() * 4,
    }
    setPlaced((p) => [...p, flower])
    setSelected(flower.id)
    setCritique(null)
    showNote(kind)
  }

  function svgPoint(e: PointerEvent): { x: number; y: number } {
    const svg = svgRef.current!
    const pt = new DOMPoint(e.clientX, e.clientY)
    const { x, y } = pt.matrixTransform(svg.getScreenCTM()!.inverse())
    return { x, y }
  }

  function onBloomDown(e: PointerEvent, id: number) {
    e.stopPropagation()
    dragRef.current = { id, moved: false }
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: PointerEvent) {
    const drag = dragRef.current
    if (!drag) return
    drag.moved = true
    const { x, y } = svgPoint(e)
    setPlaced((p) =>
      p.map((f) =>
        f.id === drag.id
          ? { ...f, x: Math.min(725, Math.max(35, x)), y: Math.min(330, Math.max(45, y)) }
          : f,
      ),
    )
  }

  function onPointerUp() {
    const drag = dragRef.current
    if (drag && !drag.moved) setSelected(drag.id)
    dragRef.current = null
  }

  function cycleColor(id: number) {
    setPlaced((p) =>
      p.map((f) =>
        f.id === id
          ? { ...f, colorIdx: (f.colorIdx + 1) % FLOWER_DEFS[f.kind].palette.length }
          : f,
      ),
    )
  }

  function setColor(id: number, idx: number) {
    setPlaced((p) => p.map((f) => (f.id === id ? { ...f, colorIdx: idx } : f)))
  }

  function remove(id: number) {
    setPlaced((p) => p.filter((f) => f.id !== id))
    setSelected(null)
  }

  function clearAll() {
    setPlaced([])
    setSelected(null)
    setCritique(null)
  }

  async function askCritique() {
    if (placed.length === 0 || critiqueLoading) return
    const counts = new Map<string, number>()
    for (const f of placed) {
      const label = FLOWER_DEFS[f.kind].label
      counts.set(label, (counts.get(label) ?? 0) + 1)
    }
    const desc = [...counts.entries()].map(([n, c]) => `${n}x${c}`).join(',')
    setCritiqueLoading(true)
    setCritique(null)
    try {
      const url = new URL('/critique', API_BASE)
      url.searchParams.set('q', desc)
      const res = await fetch(url)
      if (!res.ok) throw new Error(`${res.status}`)
      const data = await res.json()
      setCritique(data.critique)
      setPetalRain(true)
      setTimeout(() => setPetalRain(false), 7000)
    } catch {
      setCritique('花艺老师暂时联系不上,稍后再试试吧(后端服务开着吗?)')
    } finally {
      setCritiqueLoading(false)
    }
  }

  const selectedFlower = placed.find((f) => f.id === selected)
  const vaseColor = VASE_COLORS[vaseIdx]

  return (
    <div className="studio">
      <p className="studio-hint">
        从花架摘花入瓶 · 拖动花头弯一弯枝条 · 点选花朵换颜色 · 点花瓶换釉色
      </p>

      <div className="shelf">
        {(Object.keys(FLOWER_DEFS) as Kind[]).map((kind) => (
          <button key={kind} type="button" className="shelf-item" onClick={() => addFlower(kind)}>
            <svg viewBox="-34 -38 68 72" width="52" height="56">
              <Bloom kind={kind} color={FLOWER_DEFS[kind].palette[0]} />
            </svg>
            <span>{FLOWER_DEFS[kind].label}</span>
          </button>
        ))}
      </div>

      <div className="canvas-wrap">
        <svg
          ref={svgRef}
          viewBox="0 0 760 520"
          className="studio-canvas"
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerDown={() => setSelected(null)}
        >
          {/* table line */}
          <path d="M30,486 C230,480 530,480 730,486" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" opacity="0.5" />

          {/* stems (behind vase mouth) */}
          {placed.map((f) => {
            const cx = (f.ax + f.x) / 2 + (f.x - f.ax) * 0.18
            const cy = (f.ay + f.y) / 2 + 22
            return (
              <g key={`stem-${f.id}`}>
                <path
                  d={`M${f.ax},${f.ay} Q${cx},${cy} ${f.x},${f.y}`}
                  fill="none" stroke="#6c7f5a" strokeWidth="3" strokeLinecap="round"
                />
                {f.kind !== 'gypsophila' && f.kind !== 'eucalyptus' && (
                  <ellipse
                    cx={(f.ax + cx) / 2 + 8} cy={(f.ay + cy) / 2} rx="9" ry="4"
                    fill="#8ba172" stroke={INK} strokeWidth="1.4"
                    transform={`rotate(-32 ${(f.ax + cx) / 2 + 8} ${(f.ay + cy) / 2})`}
                  />
                )}
              </g>
            )
          })}

          {/* vase */}
          <g className="vase" onPointerDown={(e) => { e.stopPropagation() }} onClick={(e) => { e.stopPropagation(); setVaseIdx((v) => (v + 1) % VASE_COLORS.length) }}>
            <path
              d="M332,362 C330,368 334,372 341,373 C329,402 325,442 342,468 C353,487 407,487 418,468 C435,442 431,402 419,373 C426,372 430,368 428,362 Z"
              fill={vaseColor} fillOpacity="0.92" stroke={INK} strokeWidth="2.2" strokeLinejoin="round"
            />
            <ellipse cx="380" cy="362" rx="48" ry="7" fill={vaseColor} stroke={INK} strokeWidth="2" />
            <path d="M348,430 C350,448 356,462 366,470" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="4" strokeLinecap="round" />
          </g>

          {/* blooms */}
          {placed.map((f) => (
            <g
              key={f.id}
              className="sway"
              style={{
                transformOrigin: `${f.ax}px ${f.ay}px`,
                animationDuration: `${f.swayDur}s`,
                animationDelay: `${f.swayDelay}s`,
              }}
            >
              <g
                className={selected === f.id ? 'bloom selected' : 'bloom'}
                transform={`translate(${f.x} ${f.y})`}
                onPointerDown={(e) => onBloomDown(e, f.id)}
                onDoubleClick={() => remove(f.id)}
              >
                {selected === f.id && <circle r="34" fill="none" stroke={INK} strokeWidth="1.2" strokeDasharray="4 5" opacity="0.6" />}
                <Bloom kind={f.kind} color={FLOWER_DEFS[f.kind].palette[f.colorIdx]} />
              </g>
            </g>
          ))}

          {placed.length === 0 && (
            <text x="380" y="250" textAnchor="middle" className="canvas-empty">
              花瓶还空着,从上面的花架摘一朵吧
            </text>
          )}
        </svg>

        {/* butterfly */}
        {placed.length >= 3 && (
          <div className="butterfly" aria-hidden="true">
            <svg viewBox="-16 -12 32 24" width="34" height="26">
              <g className="wing-l">
                <ellipse cx="-7" cy="-3" rx="7" ry="6" fill="#e8b64c" stroke={INK} strokeWidth="1.3" />
                <ellipse cx="-6" cy="4" rx="5" ry="4" fill="#f3d1da" stroke={INK} strokeWidth="1.3" />
              </g>
              <g className="wing-r">
                <ellipse cx="7" cy="-3" rx="7" ry="6" fill="#e8b64c" stroke={INK} strokeWidth="1.3" />
                <ellipse cx="6" cy="4" rx="5" ry="4" fill="#f3d1da" stroke={INK} strokeWidth="1.3" />
              </g>
              <line x1="0" y1="-8" x2="0" y2="9" stroke={INK} strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        )}

        {/* petal rain */}
        {petalRain && (
          <div className="petal-rain" aria-hidden="true">
            {Array.from({ length: 16 }, (_, i) => (
              <span
                key={i}
                className="petal"
                style={{
                  left: `${4 + (i * 6.1) % 92}%`,
                  animationDelay: `${(i % 8) * 0.45}s`,
                  animationDuration: `${3.2 + (i % 5) * 0.7}s`,
                  background: ['#e59aae', '#f2d3da', '#f6c95c', '#cfc3e6'][i % 4],
                }}
              />
            ))}
          </div>
        )}

        {/* 花语 note */}
        {note && (
          <div className="huayu-note" key={note.key}>
            <strong>{note.label}</strong>
            <span>{note.huayu}</span>
          </div>
        )}

        {/* selected toolbar */}
        {selectedFlower && (
          <div className="bloom-toolbar">
            <span className="bloom-toolbar-name">{FLOWER_DEFS[selectedFlower.kind].label}</span>
            {FLOWER_DEFS[selectedFlower.kind].palette.map((c, i) => (
              <button
                key={c}
                type="button"
                className={i === selectedFlower.colorIdx ? 'swatch on' : 'swatch'}
                style={{ background: c }}
                onClick={() => setColor(selectedFlower.id, i)}
                aria-label={`颜色 ${i + 1}`}
              />
            ))}
            <button type="button" className="toolbar-btn" onClick={() => cycleColor(selectedFlower.id)}>换色</button>
            <button type="button" className="toolbar-btn" onClick={() => remove(selectedFlower.id)}>取走</button>
          </div>
        )}
      </div>

      <div className="studio-actions">
        <button type="button" className="ink-btn" onClick={askCritique} disabled={placed.length === 0 || critiqueLoading}>
          {critiqueLoading ? '老师端详中…' : '请花艺老师点评'}
        </button>
        <button type="button" className="ink-btn ghost" onClick={clearAll} disabled={placed.length === 0}>
          重新来过
        </button>
      </div>

      {critique && (
        <section className="note critique-note">
          <div className="note-label">花艺老师说</div>
          <p className="note-text">{critique}</p>
        </section>
      )}
    </div>
  )
}

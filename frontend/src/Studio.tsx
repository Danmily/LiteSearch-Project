import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'

const API_BASE = 'http://localhost:8000'
const INK = '#4a4238'

type Kind =
  | 'rose'
  | 'peony'
  | 'ranunculus'
  | 'eustoma'
  | 'tulip'
  | 'carnation'
  | 'sunflower'
  | 'daisy'
  | 'chamomile'
  | 'hydrangea'
  | 'lily'
  | 'stock'
  | 'lavender'
  | 'lilyvalley'
  | 'forgetmenot'
  | 'gypsophila'
  | 'eucalyptus'

type Role = 'focal' | 'standard' | 'filler' | 'spike' | 'foliage'

interface FlowerDef {
  label: string
  huayu: string
  palette: string[]
  role: Role
  scale: number
}

const ROLE_LABEL: Record<Role, string> = {
  focal: '主花', standard: '中花', filler: '碎花', spike: '线状花', foliage: '叶材',
}

export const FLOWER_DEFS: Record<Kind, FlowerDef> = {
  rose: {
    label: '玫瑰', huayu: '热烈的爱、温柔的告白', role: 'focal', scale: 1.2,
    palette: ['#e59aae', '#cf5b76', '#f2d3da', '#efe3c4', '#b8405f'],
  },
  peony: {
    label: '芍药', huayu: '情有所钟、依依惜别', role: 'focal', scale: 1.5,
    palette: ['#f2b8c6', '#e58aa3', '#f7e9d8', '#e8707f'],
  },
  ranunculus: {
    label: '花毛茛', huayu: '受欢迎、光彩夺目', role: 'focal', scale: 1.12,
    palette: ['#f3d9a4', '#e89a5f', '#e77e93', '#f4efe1', '#b8405f'],
  },
  sunflower: {
    label: '向日葵', huayu: '阳光、沉默的爱', role: 'focal', scale: 1.35,
    palette: ['#f2b31f', '#e8930c', '#f6c95c'],
  },
  hydrangea: {
    label: '绣球', huayu: '希望、圆满、感谢你的理解', role: 'focal', scale: 1.45,
    palette: ['#9db8dd', '#d8a9c4', '#b9cf9e', '#cfc3e6'],
  },
  lily: {
    label: '百合', huayu: '纯洁、百年好合', role: 'focal', scale: 1.35,
    palette: ['#f5f0e2', '#f0c8d8', '#f2dc9b'],
  },
  eustoma: {
    label: '洋桔梗', huayu: '不变的爱、真诚的感动', role: 'standard', scale: 1.02,
    palette: ['#f4eee0', '#cbb3dd', '#e9b9cd', '#f2e3c8'],
  },
  tulip: {
    label: '郁金香', huayu: '博爱、体贴、优雅', role: 'standard', scale: 1.0,
    palette: ['#e0719b', '#e6b23a', '#b184c9', '#dd6a52', '#f3ecd8'],
  },
  carnation: {
    label: '康乃馨', huayu: '母爱、温馨、感恩', role: 'standard', scale: 1.05,
    palette: ['#e88ca0', '#cf4a63', '#f6f0e3', '#f0c7d2'],
  },
  daisy: {
    label: '小雏菊', huayu: '隐藏在心底的爱、天真快乐', role: 'filler', scale: 0.72,
    palette: ['#f7f3ea', '#f3c6d3', '#f4de79'],
  },
  chamomile: {
    label: '洋甘菊', huayu: '逆境中的活力', role: 'filler', scale: 0.62,
    palette: ['#f8f4ea', '#f3e3c0'],
  },
  forgetmenot: {
    label: '勿忘我', huayu: '永恒的记忆、真挚的情谊', role: 'filler', scale: 0.6,
    palette: ['#8fb3e3', '#b6cdf0', '#e9b9cd', '#f5f1e6'],
  },
  gypsophila: {
    label: '满天星', huayu: '思念、甘愿做配角的爱', role: 'filler', scale: 0.7,
    palette: ['#f7f4ec', '#f3d9e2', '#dce6f4'],
  },
  stock: {
    label: '紫罗兰', huayu: '永恒的美、质朴、体贴', role: 'spike', scale: 1.08,
    palette: ['#b184c9', '#e3a7c0', '#f4efe1', '#efd7a0'],
  },
  lavender: {
    label: '薰衣草', huayu: '等待爱情、宁静、安睡', role: 'spike', scale: 1.02,
    palette: ['#8f7fc0', '#a99ad0', '#6f5fa8'],
  },
  lilyvalley: {
    label: '铃兰', huayu: '幸福归来、纯洁谦逊', role: 'spike', scale: 1.0,
    palette: ['#f7f4ec', '#f0ead6'],
  },
  eucalyptus: {
    label: '尤加利', huayu: '恩赐、守护、回忆', role: 'foliage', scale: 1.15,
    palette: ['#9caf88', '#7e9a72', '#b5c4a1'],
  },
}

const KINDS = Object.keys(FLOWER_DEFS) as Kind[]

/* ---------- color themes ---------- */

interface Theme { key: string; label: string; targets: string[]; swatch: string[] }

const THEMES: Theme[] = [
  { key: 'none', label: '自由', targets: [], swatch: ['#e59aae', '#f2b31f', '#9db8dd'] },
  { key: 'moonlight', label: '白紫月光', targets: ['#f5f0e2', '#b6cdf0', '#b184c9', '#9caf88'], swatch: ['#f5f0e2', '#b6cdf0', '#b184c9'] },
  { key: 'romance', label: '粉色浪漫', targets: ['#f2b8c6', '#e59aae', '#f2d3da', '#f7e9d8'], swatch: ['#f2b8c6', '#e59aae', '#f2d3da'] },
  { key: 'peach', label: '蜜桃暖阳', targets: ['#f3d9a4', '#e89a5f', '#efe3c4', '#e77e93'], swatch: ['#f3d9a4', '#e89a5f', '#e77e93'] },
  { key: 'pastel', label: '明媚混色', targets: ['#e59aae', '#f6c95c', '#b6cdf0', '#b9cf9e'], swatch: ['#e59aae', '#f6c95c', '#b6cdf0'] },
  { key: 'pure', label: '纯白清雅', targets: ['#f7f4ec', '#f5f0e2', '#9caf88', '#b5c4a1'], swatch: ['#f7f4ec', '#eef1e4', '#9caf88'] },
]

function hexRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function colorDist(a: string, b: string): number {
  const [r1, g1, b1] = hexRgb(a)
  const [r2, g2, b2] = hexRgb(b)
  return (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2
}
function bestPaletteIdx(palette: string[], targets: string[]): { idx: number; dist: number } {
  if (targets.length === 0) return { idx: 0, dist: 0 }
  let idx = 0, best = Infinity
  palette.forEach((c, i) => {
    const d = Math.min(...targets.map((t) => colorDist(c, t)))
    if (d < best) { best = d; idx = i }
  })
  return { idx, dist: best }
}
const THEME_FIT = 9000 // squared-rgb threshold: below = "fits the theme"

/* ---------- hand-drawn blooms, centred on (0,0) ---------- */

export function Bloom({ kind, color }: { kind: Kind; color: string }) {
  const s = { stroke: INK, strokeWidth: 2, strokeLinecap: 'round' as const }
  switch (kind) {
    case 'rose':
      return (
        <g>
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="0" cy="-15" rx="12" ry="11" fill={color} {...s} transform={`rotate(${a})`} />
          ))}
          <circle r="15" fill={color} {...s} />
          <path d="M0,-10 C8,-9 10,1 2,6 C-6,10 -11,3 -6,-3 C-2,-7 4,-6 4,0" fill="none" {...s} strokeWidth="1.7" />
          {[40, 160, 280].map((a) => (
            <path key={a} d="M0,-6 C5,-6 6,1 1,4" fill="none" {...s} strokeWidth="1.4" transform={`rotate(${a})`} />
          ))}
        </g>
      )
    case 'peony':
      return (
        <g>
          {Array.from({ length: 8 }, (_, k) => (
            <ellipse key={k} cx="0" cy="-19" rx="10" ry="13" fill={color} {...s} transform={`rotate(${k * 45})`} />
          ))}
          {Array.from({ length: 6 }, (_, k) => (
            <ellipse key={`m${k}`} cx="0" cy="-12" rx="7.5" ry="10" fill={color} {...s} strokeWidth="1.6" transform={`rotate(${k * 60 + 18})`} />
          ))}
          <circle r="10" fill={color} {...s} />
          {[0, 90, 180, 270].map((a) => (
            <ellipse key={a} cx="0" cy="-4.5" rx="4" ry="6" fill={color} {...s} strokeWidth="1.3" transform={`rotate(${a})`} />
          ))}
          <circle cx="-2" cy="1" r="1.5" fill="#c98a2d" stroke="none" />
          <circle cx="3" cy="-1" r="1.5" fill="#c98a2d" stroke="none" />
        </g>
      )
    case 'ranunculus':
      return (
        <g>
          <circle r="20" fill={color} {...s} />
          <circle cx="1.5" cy="-1" r="14" fill="none" {...s} strokeWidth="1.7" />
          <circle cx="-1" cy="1" r="8.5" fill="none" {...s} strokeWidth="1.6" />
          <circle cx="0.5" cy="0" r="3.5" fill="#5c6b46" stroke="none" />
        </g>
      )
    case 'eustoma':
      return (
        <g>
          {Array.from({ length: 5 }, (_, k) => (
            <ellipse key={k} cx="0" cy="-14" rx="9" ry="13" fill={color} {...s} transform={`rotate(${k * 72})`} />
          ))}
          <circle r="9" fill={color} {...s} />
          <path d="M0,-6 C6,-5 6,3 1,4 C-4,5 -6,0 -3,-3" fill="none" {...s} strokeWidth="1.7" />
        </g>
      )
    case 'tulip':
      return (
        <g>
          <path d="M-18,-4 C-21,-24 -9,-30 0,-17 C9,-30 21,-24 18,-4 C16,12 -16,12 -18,-4 Z" fill={color} {...s} />
          <path d="M-7,-15 C-6,-27 6,-27 7,-15" fill="none" {...s} />
        </g>
      )
    case 'carnation':
      return (
        <g>
          <path d="M-19,2 C-23,-8 -14,-17 -8,-13 C-8,-22 4,-24 7,-16 C15,-21 23,-11 17,-3 C24,3 17,14 9,12 C7,20 -6,21 -9,13 C-17,17 -23,9 -19,2 Z" fill={color} {...s} />
          <path d="M-9,-2 C-11,-8 -3,-13 1,-8 C5,-13 12,-7 10,-1 C13,5 6,10 2,7 C-2,11 -9,8 -9,-2 Z" fill="none" {...s} strokeWidth="1.7" />
        </g>
      )
    case 'sunflower':
      return (
        <g>
          {Array.from({ length: 12 }, (_, k) => (
            <ellipse key={k} cx="0" cy="-21" rx="6" ry="12" fill={color} {...s} transform={`rotate(${k * 30})`} />
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
            <ellipse key={k} cx="0" cy="-16" rx="4.5" ry="11" fill={color} {...s} transform={`rotate(${k * 32.7})`} />
          ))}
          <circle r="8" fill="#f2c14e" {...s} />
        </g>
      )
    case 'chamomile':
      return (
        <g>
          {Array.from({ length: 8 }, (_, k) => (
            <ellipse key={k} cx="0" cy="-13" rx="4" ry="10" fill={color} {...s} strokeWidth="1.7" transform={`rotate(${k * 45})`} />
          ))}
          <circle r="7" fill="#e9b83c" {...s} strokeWidth="1.7" />
        </g>
      )
    case 'hydrangea': {
      const spots: [number, number][] = [[0, -13], [-14, -3], [14, -3], [-8, 10], [8, 10], [0, 2], [-15, 11]]
      return (
        <g>
          {spots.map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y})`}>
              {[0, 90, 180, 270].map((r) => (
                <ellipse key={r} cx="0" cy="-5.5" rx="4.5" ry="5.5" fill={color} {...s} strokeWidth="1.6" transform={`rotate(${r + (i * 17) % 40})`} />
              ))}
              <circle r="1.6" fill={INK} stroke="none" />
            </g>
          ))}
        </g>
      )
    }
    case 'lily':
      return (
        <g>
          {Array.from({ length: 6 }, (_, k) => (
            <path key={k} d="M0,2 C7,-8 8,-22 0,-29 C-8,-22 -7,-8 0,2 Z" fill={color} {...s} transform={`rotate(${k * 60})`} />
          ))}
          <path d="M-4,-2 L-7,-13 M0,0 L0,-14 M4,-2 L7,-13" fill="none" {...s} strokeWidth="1.4" />
          <circle cx="-7" cy="-14" r="2" fill="#c98a2d" stroke="none" />
          <circle cx="0" cy="-15" r="2" fill="#c98a2d" stroke="none" />
          <circle cx="7" cy="-14" r="2" fill="#c98a2d" stroke="none" />
        </g>
      )
    case 'stock':
      return (
        <g>
          <path d="M0,26 C1,10 -1,-6 0,-24" fill="none" {...s} />
          {([[0, -20], [-6, -12], [6, -10], [-5, -2], [5, 0], [0, 8]] as [number, number][]).map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y}) rotate(${(i * 23) % 45})`}>
              {[0, 90, 180, 270].map((r) => (
                <ellipse key={r} cx="0" cy="-4.5" rx="3" ry="4.5" fill={color} {...s} strokeWidth="1.4" transform={`rotate(${r})`} />
              ))}
              <circle r="1.4" fill={INK} stroke="none" />
            </g>
          ))}
        </g>
      )
    case 'lavender':
      return (
        <g>
          <path d="M0,26 C1,12 -1,0 0,-8" fill="none" {...s} />
          {([[0, -26], [-4.5, -20], [4.5, -19], [-4.5, -13], [4.5, -12], [-4, -6], [4, -5], [0, -1]] as [number, number][]).map(([x, y], i) => (
            <ellipse key={i} cx={x} cy={y} rx="4" ry="5.5" fill={color} {...s} strokeWidth="1.5" />
          ))}
          <path d="M-2,14 C-8,10 -10,4 -9,0 M2,16 C8,13 10,7 9,3" fill="none" {...s} strokeWidth="1.5" />
        </g>
      )
    case 'lilyvalley':
      return (
        <g>
          <path d="M-4,26 C-8,6 2,-14 16,-22" fill="none" {...s} />
          <ellipse cx="-10" cy="8" rx="7" ry="16" fill="#8ba172" {...s} strokeWidth="1.6" transform="rotate(-14 -10 8)" />
          {([[0, -4, 9], [7, -13, 9], [15, -20, 8]] as [number, number, number][]).map(([x, y, sc], i) => (
            <path key={i}
              d={`M${x},${y} c${-sc * 0.55},0.5 ${-sc * 0.7},${sc * 0.8} ${-sc * 0.45},${sc} l${sc * 0.18},-0.2 l${sc * 0.15},${sc * 0.22} l${sc * 0.15},-${sc * 0.22} l${sc * 0.18},0.2 c${sc * 0.25},-0.2 ${sc * 0.1},-${sc} ${-sc * 0.21},-${sc}`}
              fill={color} {...s} strokeWidth="1.5" />
          ))}
        </g>
      )
    case 'forgetmenot':
      return (
        <g>
          {([[-9, -8], [8, -3], [-1, 9]] as [number, number][]).map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y}) rotate(${i * 25})`}>
              {Array.from({ length: 5 }, (_, k) => (
                <circle key={k} cx="0" cy="-6" r="4" fill={color} {...s} strokeWidth="1.5" transform={`rotate(${k * 72})`} />
              ))}
              <circle r="2.4" fill="#f2c14e" stroke={INK} strokeWidth="1" />
            </g>
          ))}
          <circle cx="12" cy="-14" r="2.4" fill={color} {...s} strokeWidth="1.3" />
          <circle cx="-14" cy="6" r="2.4" fill={color} {...s} strokeWidth="1.3" />
        </g>
      )
    case 'gypsophila':
      return (
        <g>
          <path d="M0,22 C-4,8 -12,0 -16,-10 M0,22 C0,8 1,-4 0,-16 M0,22 C5,10 12,2 15,-7" fill="none" {...s} strokeWidth="1.6" />
          {([[-16, -12], [0, -18], [15, -9], [-9, -2], [8, 0], [-3, -9]] as [number, number][]).map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="4" fill={color} {...s} strokeWidth="1.6" />
          ))}
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

/* ---------- placement by role ---------- */

const CX = 380
const CY = 236
const MOUTH_Y = 366

// Wide, shallow dome: flowers pack and overlap into a gathered bouquet.
interface Band { rMin: number; rMax: number; yBias: number; aMin: number; aMax: number }
const ROLE_BAND: Record<Role, Band> = {
  focal: { rMin: 0, rMax: 44, yBias: 10, aMin: 0, aMax: 360 },
  standard: { rMin: 30, rMax: 74, yBias: -4, aMin: 0, aMax: 360 },
  filler: { rMin: 52, rMax: 104, yBias: -14, aMin: -200, aMax: 20 },
  spike: { rMin: 44, rMax: 86, yBias: -40, aMin: -150, aMax: -30 },
  foliage: { rMin: 80, rMax: 124, yBias: 16, aMin: -206, aMax: 26 },
}

function placeHead(role: Role, count: number): { x: number; y: number } {
  const b = ROLE_BAND[role]
  const spread = 1 + count * 0.008
  const deg = b.aMin + Math.random() * (b.aMax - b.aMin)
  const a = (deg * Math.PI) / 180
  const r = (b.rMin + Math.random() * (b.rMax - b.rMin)) * spread
  const x = CX + Math.cos(a) * r * 1.15
  const y = CY + Math.sin(a) * r * 0.7 + b.yBias
  return {
    x: Math.min(542, Math.max(218, x)),
    y: Math.min(344, Math.max(126, y)),
  }
}

const Z: Record<Role, number> = { foliage: 0, spike: 1, focal: 2, standard: 3, filler: 4 }

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

interface Note { key: number; label: string; huayu: string; role: string }

const STORAGE_KEY = 'huayuji-arrangement-v2'
const THEME_KEY = 'huayuji-theme-v1'
const VASE_COLORS = ['#c67d54', '#7c93a8', '#5b7d64', '#d9c07a', '#8a6b9e', '#e6e2d6']
const MAX_STEMS = 18

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
  const [themeKey, setThemeKey] = useState<string>(() => localStorage.getItem(THEME_KEY) ?? 'none')
  const [vaseIdx, setVaseIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [note, setNote] = useState<Note | null>(null)
  const [critique, setCritique] = useState<string | null>(null)
  const [critiqueLoading, setCritiqueLoading] = useState(false)
  const [petalRain, setPetalRain] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const dragRef = useRef<{ id: number; moved: boolean } | null>(null)
  const noteTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const theme = THEMES.find((t) => t.key === themeKey) ?? THEMES[0]

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(placed)) }, [placed])
  useEffect(() => { localStorage.setItem(THEME_KEY, themeKey) }, [themeKey])

  function showNote(kind: Kind) {
    const def = FLOWER_DEFS[kind]
    clearTimeout(noteTimer.current)
    setNote({ key: Date.now(), label: def.label, huayu: def.huayu, role: ROLE_LABEL[def.role] })
    noteTimer.current = setTimeout(() => setNote(null), 4200)
  }

  function pickColor(kind: Kind): number {
    const def = FLOWER_DEFS[kind]
    if (theme.targets.length === 0) return Math.floor(Math.random() * def.palette.length)
    return bestPaletteIdx(def.palette, theme.targets).idx
  }

  function addFlower(kind: Kind) {
    if (placed.length >= MAX_STEMS) return
    const def = FLOWER_DEFS[kind]
    const head = placeHead(def.role, placed.length)
    const flower: Placed = {
      id: nextId++,
      kind,
      colorIdx: pickColor(kind),
      ax: CX - 18 + (head.x - CX) * 0.12,
      ay: MOUTH_Y,
      x: head.x,
      y: head.y,
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
          ? { ...f, x: Math.min(725, Math.max(35, x)), y: Math.min(348, Math.max(45, y)) }
          : f,
      ),
    )
  }

  function onPointerUp() {
    const drag = dragRef.current
    if (drag && !drag.moved) setSelected(drag.id)
    dragRef.current = null
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

  function applyTheme(t: Theme) {
    setThemeKey(t.key)
    if (t.targets.length === 0) return
    setPlaced((p) =>
      p.map((f) => ({ ...f, colorIdx: bestPaletteIdx(FLOWER_DEFS[f.kind].palette, t.targets).idx })),
    )
  }

  function recolorToTheme() {
    if (theme.targets.length === 0) return
    setPlaced((p) =>
      p.map((f) => ({ ...f, colorIdx: bestPaletteIdx(FLOWER_DEFS[f.kind].palette, theme.targets).idx })),
    )
  }

  /* behaviour-driven advice */
  const advice = useMemo(() => {
    const roleCount: Record<Role, number> = { focal: 0, standard: 0, filler: 0, spike: 0, foliage: 0 }
    placed.forEach((f) => { roleCount[FLOWER_DEFS[f.kind].role]++ })
    const n = placed.length

    let offTheme = 0
    if (theme.targets.length) {
      placed.forEach((f) => {
        const d = bestPaletteIdx(FLOWER_DEFS[f.kind].palette, theme.targets).dist
        if (d > THEME_FIT) offTheme++
      })
    }

    let missing: Role | null = null
    if (roleCount.focal === 0) missing = 'focal'
    else if (roleCount.filler === 0 && n >= 1) missing = 'filler'
    else if (roleCount.foliage === 0 && n >= 3) missing = 'foliage'
    else if (roleCount.spike === 0 && n >= 4) missing = 'spike'

    let tip: string
    if (n === 0) tip = '先从花架选一支主花(芍药、绣球、玫瑰)定个调子吧 🌸'
    else if (missing === 'focal') tip = '这瓶还缺一支主花做焦点,试试芍药、绣球或向日葵'
    else if (missing === 'filler') tip = '加几支碎花(满天星、雏菊、勿忘我)填空隙,会立刻饱满起来'
    else if (missing === 'foliage') tip = '点一支尤加利叶收收边,轮廓会更自然'
    else if (missing === 'spike') tip = '加一支薰衣草或紫罗兰把轮廓拉高,更灵动'
    else tip = '主花、碎花、叶材都齐了,配比很舒服——可以请老师点评啦'

    if (offTheme > 0 && theme.targets.length)
      tip += ` · 有 ${offTheme} 支颜色偏离了「${theme.label}」,点「按主题配色」可统一`

    // suggested shelf kinds: fill the missing role, prefer theme-fitting
    let suggest: Kind[] = []
    if (missing) {
      suggest = KINDS.filter((k) => FLOWER_DEFS[k].role === missing)
      if (theme.targets.length) {
        suggest = suggest
          .map((k) => ({ k, d: bestPaletteIdx(FLOWER_DEFS[k].palette, theme.targets).dist }))
          .sort((a, b) => a.d - b.d)
          .map((o) => o.k)
      }
      suggest = suggest.slice(0, 3)
    }
    return { tip, suggest: new Set(suggest) }
  }, [placed, theme])

  async function askCritique() {
    if (placed.length === 0 || critiqueLoading) return
    const counts = new Map<string, number>()
    for (const f of placed) {
      const label = FLOWER_DEFS[f.kind].label
      counts.set(label, (counts.get(label) ?? 0) + 1)
    }
    const desc = [...counts.entries()].map(([n, c]) => `${n}x${c}`).join(',')
    const q = theme.targets.length ? `主题:${theme.label};${desc}` : desc
    setCritiqueLoading(true)
    setCritique(null)
    try {
      const url = new URL('/critique', API_BASE)
      url.searchParams.set('q', q)
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
  const drawOrder = [...placed].sort((a, b) => {
    const za = Z[FLOWER_DEFS[a.kind].role]
    const zb = Z[FLOWER_DEFS[b.kind].role]
    if (za !== zb) return za - zb
    return a.y - b.y
  })

  return (
    <div className="studio">
      <p className="studio-hint">
        从花架摘花入瓶 · 大花做焦点 / 碎花填空 / 叶材收边 · 拖动花头弯枝 · 点选换色
      </p>

      {/* colour themes */}
      <div className="theme-bar">
        <span className="theme-bar-label">配色主题</span>
        {THEMES.map((t) => (
          <button
            key={t.key}
            type="button"
            className={t.key === themeKey ? 'theme-chip on' : 'theme-chip'}
            onClick={() => applyTheme(t)}
          >
            <span className="theme-dots">
              {t.swatch.map((c, i) => <i key={i} style={{ background: c }} />)}
            </span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="shelf">
        {KINDS.map((kind) => (
          <button
            key={kind}
            type="button"
            className={advice.suggest.has(kind) ? 'shelf-item suggested' : 'shelf-item'}
            onClick={() => addFlower(kind)}
            title={`${FLOWER_DEFS[kind].label} · ${ROLE_LABEL[FLOWER_DEFS[kind].role]}`}
          >
            <svg viewBox="-34 -38 68 72" width="50" height="54">
              <Bloom kind={kind} color={FLOWER_DEFS[kind].palette[theme.targets.length ? bestPaletteIdx(FLOWER_DEFS[kind].palette, theme.targets).idx : 0]} />
            </svg>
            <span>{FLOWER_DEFS[kind].label}</span>
          </button>
        ))}
      </div>

      <div className="tip-banner">{advice.tip}</div>

      <div className="canvas-wrap">
        <svg
          ref={svgRef}
          viewBox="0 0 760 520"
          className="studio-canvas"
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerDown={() => setSelected(null)}
        >
          <path d="M30,486 C230,480 530,480 730,486" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" opacity="0.5" />

          {/* stems */}
          {drawOrder.map((f) => {
            const cx = (f.ax + f.x) / 2 + (f.x - f.ax) * 0.18
            const cy = (f.ay + f.y) / 2 + 22
            return (
              <path
                key={`stem-${f.id}`}
                d={`M${f.ax},${f.ay} Q${cx},${cy} ${f.x},${f.y}`}
                fill="none" stroke="#6c7f5a" strokeWidth="2.6" strokeLinecap="round"
              />
            )
          })}

          {/* vase */}
          <g className="vase" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setVaseIdx((v) => (v + 1) % VASE_COLORS.length) }}>
            <path
              d="M332,362 C330,368 334,372 341,373 C329,402 325,442 342,468 C353,487 407,487 418,468 C435,442 431,402 419,373 C426,372 430,368 428,362 Z"
              fill={vaseColor} fillOpacity="0.92" stroke={INK} strokeWidth="2.2" strokeLinejoin="round"
            />
            <ellipse cx="380" cy="362" rx="48" ry="7" fill={vaseColor} stroke={INK} strokeWidth="2" />
            <path d="M348,430 C350,448 356,462 366,470" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="4" strokeLinecap="round" />
          </g>

          {/* blooms */}
          {drawOrder.map((f) => {
            const sc = FLOWER_DEFS[f.kind].scale
            return (
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
                  transform={`translate(${f.x} ${f.y}) scale(${sc})`}
                  onPointerDown={(e) => onBloomDown(e, f.id)}
                  onDoubleClick={() => remove(f.id)}
                >
                  {selected === f.id && <circle r="30" fill="none" stroke={INK} strokeWidth="1.4" strokeDasharray="4 5" opacity="0.6" />}
                  <Bloom kind={f.kind} color={FLOWER_DEFS[f.kind].palette[f.colorIdx]} />
                </g>
              </g>
            )
          })}

          {placed.length === 0 && (
            <text x="380" y="250" textAnchor="middle" className="canvas-empty">
              花瓶还空着,从上面的花架摘一朵吧
            </text>
          )}
        </svg>

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
                  background: (theme.targets.length ? theme.swatch : ['#e59aae', '#f2d3da', '#f6c95c', '#cfc3e6'])[i % (theme.targets.length ? theme.swatch.length : 4)],
                }}
              />
            ))}
          </div>
        )}

        {note && (
          <div className="huayu-note" key={note.key}>
            <strong>{note.label}<em>{note.role}</em></strong>
            <span>{note.huayu}</span>
          </div>
        )}

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
            <button type="button" className="toolbar-btn" onClick={() => remove(selectedFlower.id)}>取走</button>
          </div>
        )}
      </div>

      <div className="studio-actions">
        <button type="button" className="ink-btn" onClick={askCritique} disabled={placed.length === 0 || critiqueLoading}>
          {critiqueLoading ? '老师端详中…' : '请花艺老师点评'}
        </button>
        {theme.targets.length > 0 && (
          <button type="button" className="ink-btn ghost" onClick={recolorToTheme} disabled={placed.length === 0}>
            按主题配色
          </button>
        )}
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

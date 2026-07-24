import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { useAuth, authHeader } from './auth'

const API_BASE = 'http://localhost:8000'
export const INK = '#4a4238'

export type Kind =
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

export type Role = 'focal' | 'standard' | 'filler' | 'spike' | 'foliage'

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

export interface Theme { key: string; label: string; targets: string[]; swatch: string[] }

export const THEMES: Theme[] = [
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

export function mixHex(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexRgb(a)
  const [r2, g2, b2] = hexRgb(b)
  const m = (x: number, y: number) => Math.round(x + (y - x) * t).toString(16).padStart(2, '0')
  return `#${m(r1, r2)}${m(g1, g2)}${m(b1, b2)}`
}

/* ---------- spray tints ---------- */

interface Spray { key: string; label: string; color: string }
const SPRAYS: Spray[] = [
  { key: 'gold', label: '金粉', color: '#d9b45a' },
  { key: 'frost', label: '霜白', color: '#eef2f4' },
  { key: 'mist', label: '雾紫', color: '#b9a7d6' },
  { key: 'peach', label: '蜜桃', color: '#f2c0a0' },
  { key: 'mint', label: '薄荷', color: '#a8cbb0' },
]

/* ---------- lighting moods ---------- */

export interface Light { key: string; label: string; bg: string; overlay: string; blend: string; dark?: boolean }
export const LIGHTS: Light[] = [
  { key: 'studio', label: '柔光棚', bg: '#fdfaf1', overlay: 'none', blend: 'normal' },
  { key: 'morning', label: '晨光', bg: '#fdf7ea', overlay: 'linear-gradient(115deg, rgba(255,214,140,0.34), rgba(255,255,255,0) 55%)', blend: 'soft-light' },
  { key: 'golden', label: '黄昏', bg: '#f4e6cf', overlay: 'radial-gradient(120% 95% at 78% 15%, rgba(255,168,86,0.42), rgba(150,86,44,0.14) 72%)', blend: 'soft-light' },
  { key: 'moon', label: '月夜', bg: '#33302b', overlay: 'radial-gradient(135% 105% at 50% -5%, rgba(150,180,235,0.34), rgba(24,28,42,0.5))', blend: 'soft-light', dark: true },
]

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

/* ---------- containers ---------- */

export type VaseMaterial = 'ceramic' | 'glass' | 'bamboo' | 'metal'

export interface VaseKind {
  key: string
  label: string
  material: VaseMaterial
  /** fixed tint for glass kinds; color choices for ceramic/bamboo/metal */
  palette: string[]
  rimRx: number
  rimRy: number
}

export const VASE_KINDS: VaseKind[] = [
  { key: 'ceramic', label: '陶瓷花瓶', material: 'ceramic', palette: ['#f7f3ea', '#8298ab', '#d9c9a3'], rimRx: 48, rimRy: 7 },
  { key: 'glass-round', label: '玻璃花瓶(圆形)', material: 'glass', palette: ['#cfe3dd'], rimRx: 48, rimRy: 7 },
  { key: 'glass-square', label: '玻璃花瓶(方形)', material: 'glass', palette: ['#cddbe8'], rimRx: 36, rimRy: 7 },
  { key: 'glass-tall', label: '玻璃花瓶(高瘦型)', material: 'glass', palette: ['#d7e8d2'], rimRx: 24, rimRy: 6 },
  { key: 'glass-cup', label: '玻璃杯', material: 'glass', palette: ['#e8e3d5'], rimRx: 54, rimRy: 7 },
  { key: 'bamboo', label: '竹筒', material: 'bamboo', palette: ['#8ea86a', '#c9a877'], rimRx: 24, rimRy: 6 },
  { key: 'metal', label: '金属花瓶', material: 'metal', palette: ['#b9bfc4', '#c9a227'], rimRx: 36, rimRy: 6.5 },
]

export type DecorKey = 'ribbon' | 'beads' | 'bow' | 'pebbles'

export const DECORATIONS: { key: DecorKey; label: string }[] = [
  { key: 'ribbon', label: '丝带' },
  { key: 'beads', label: '珠串' },
  { key: 'bow', label: '蝴蝶结' },
  { key: 'pebbles', label: '小石子' },
]

const ROUND_BODY = 'M334,362 C330,370 332,376 340,378 C325,406 322,446 340,470 C352,487 408,487 420,470 C438,446 435,406 420,378 C428,376 430,370 426,362 Z'
const TALL_BODY = 'M358,362 C356,368 358,372 362,374 C357,410 357,450 364,470 C370,484 390,484 396,470 C403,450 403,410 398,374 C402,372 404,368 402,362 Z'
const CUP_BODY = 'M330,362 C328,368 332,372 338,374 C334,394 334,414 340,427 C348,437 412,437 420,427 C426,414 426,394 422,374 C428,372 432,368 430,362 Z'
const METAL_BODY = 'M348,362 C346,368 350,372 356,374 C348,392 344,408 356,420 C346,432 344,452 358,468 C368,480 392,480 402,468 C416,452 414,432 404,420 C416,408 412,392 404,374 C410,372 414,368 412,362 Z'
const SQUARE_FRONT = 'M344,378 L416,378 L420,470 L340,470 Z'
const SQUARE_TOP = 'M344,378 L416,378 L406,364 L354,364 Z'
const SQUARE_SIDE = 'M392,378 L416,378 L420,470 L398,470 Z'

function VaseDecor({ decor }: { decor: DecorKey[] }) {
  return (
    <g>
      {decor.includes('ribbon') && (
        <g>
          <path d="M341,373 C363,384 397,384 419,373 L419,389 C397,400 363,400 341,389 Z" fill="#c9607e" stroke={INK} strokeWidth="1.4" fillOpacity="0.92" />
          <path d="M372,377 L372,394 M388,377 L388,394" stroke="#a84763" strokeWidth="1" opacity="0.55" />
        </g>
      )}
      {decor.includes('beads') && (
        <g>
          {([[340, 379], [355, 390], [370, 396], [380, 398], [390, 396], [405, 390], [420, 379]] as [number, number][]).map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="3.6" fill="#e8d27a" stroke={INK} strokeWidth="1.1" />
          ))}
        </g>
      )}
      {decor.includes('bow') && (
        <g>
          <path d="M380,380 C372,371 357,373 358,383 C358,391 372,389 380,384" fill="#d98fa3" stroke={INK} strokeWidth="1.3" />
          <path d="M380,380 C388,371 403,373 402,383 C402,391 388,389 380,384" fill="#d98fa3" stroke={INK} strokeWidth="1.3" />
          <circle cx="380" cy="382" r="4" fill="#b8607a" stroke={INK} strokeWidth="1.1" />
        </g>
      )}
      {decor.includes('pebbles') && (
        <g>
          {([[350, 486, 9, 6, '#b7ada0'], [368, 490, 7, 5, '#c9c1b4'], [388, 491, 8, 5.5, '#a89e90'], [405, 487, 6, 4.5, '#c2b8a9']] as [number, number, number, number, string][]).map(
            ([x, y, rx, ry, fill], i) => (
              <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} fill={fill} stroke={INK} strokeWidth="1.1" />
            ),
          )}
        </g>
      )}
    </g>
  )
}

/** Renders any of VASE_KINDS with its material effect + optional decorations.
 *  Shared verbatim between Studio's interactive canvas and the read-only
 *  ArrangementView, unlike Bloom which has no such reuse concern here. */
export function VaseGraphic({ kind, colorIdx }: { kind: string; colorIdx: number }) {
  const uid = useId()
  const def = VASE_KINDS.find((v) => v.key === kind) ?? VASE_KINDS[0]
  const color = def.palette[colorIdx] ?? def.palette[0]
  const gid = (name: string) => `vase-${name}-${uid}`

  if (def.material === 'glass') {
    const body = def.key === 'glass-square' ? null : def.key === 'glass-tall' ? TALL_BODY : def.key === 'glass-cup' ? CUP_BODY : ROUND_BODY
    return (
      <g>
        {def.key === 'glass-square' ? (
          <g>
            <path d={SQUARE_FRONT} fill={color} fillOpacity="0.38" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
            <path d={SQUARE_SIDE} fill={INK} fillOpacity="0.1" stroke="none" />
            <path d="M352,392 L352,462 M360,388 L360,466" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="3" strokeLinecap="round" />
            <path d={SQUARE_TOP} fill={color} fillOpacity="0.55" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
            <path d="M354,364 L406,364 L399,368 L361,368 Z" fill={INK} fillOpacity="0.14" stroke="none" />
          </g>
        ) : (
          <g>
            <path d={body ?? ROUND_BODY} fill={color} fillOpacity="0.38" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
            <path
              d={def.key === 'glass-tall' ? 'M366,380 L366,462' : def.key === 'glass-cup' ? 'M344,382 L344,424' : 'M348,388 L344,456'}
              stroke="#ffffff" strokeOpacity="0.45" strokeWidth="4" strokeLinecap="round"
            />
            <ellipse cx="380" cy="362" rx={def.rimRx} ry={def.rimRy} fill={color} fillOpacity="0.55" stroke={INK} strokeWidth="2" />
            <ellipse cx="380" cy="362" rx={def.rimRx - 7} ry={Math.max(def.rimRy - 2.5, 2)} fill={INK} fillOpacity="0.16" stroke="none" />
          </g>
        )}
      </g>
    )
  }

  if (def.material === 'ceramic') {
    return (
      <g>
        <defs>
          <linearGradient id={gid('ceramic')} x1="15%" y1="10%" x2="85%" y2="95%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="45%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={INK} stopOpacity="0.28" />
          </linearGradient>
        </defs>
        <ellipse cx="380" cy="474" rx="46" ry="8" fill={INK} fillOpacity="0.14" stroke="none" />
        <path d={ROUND_BODY} fill={`url(#${gid('ceramic')})`} stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M336,410 C355,415 405,415 424,410" stroke={INK} strokeOpacity="0.16" strokeWidth="1" fill="none" />
        <path d="M332,432 C355,438 405,438 428,432" stroke={INK} strokeOpacity="0.12" strokeWidth="1" fill="none" />
        <ellipse cx="380" cy="362" rx={def.rimRx} ry={def.rimRy} fill={color} stroke={INK} strokeWidth="2" />
        <ellipse cx="380" cy="362" rx={def.rimRx - 8} ry={Math.max(def.rimRy - 3, 2)} fill={INK} fillOpacity="0.22" stroke="none" />
      </g>
    )
  }

  if (def.material === 'bamboo') {
    const dark = def.key === 'bamboo' && colorIdx === 0 ? '#5f7a40' : '#9c7a49'
    return (
      <g>
        <path d={TALL_BODY} fill={color} stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M362,376 L362,468 M370,376 L370,470 M390,376 L390,470 M398,376 L398,468" stroke={INK} strokeOpacity="0.13" strokeWidth="1" />
        {[398, 428, 458].map((ny) => (
          <path key={ny} d={`M357,${ny} C368,${ny + 4} 392,${ny + 4} 403,${ny}`} stroke={dark} strokeWidth="4" fill="none" strokeLinecap="round" />
        ))}
        <ellipse cx="380" cy="362" rx={def.rimRx} ry={def.rimRy} fill={color} stroke={INK} strokeWidth="2" />
        <ellipse cx="380" cy="362" rx={def.rimRx - 6} ry={Math.max(def.rimRy - 2.5, 2)} fill={INK} fillOpacity="0.28" stroke="none" />
      </g>
    )
  }

  // metal
  return (
    <g>
      <defs>
        <linearGradient id={gid('metal')} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={INK} stopOpacity="0.35" />
          <stop offset="30%" stopColor={color} stopOpacity="1" />
          <stop offset="48%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="65%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={INK} stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <path d={METAL_BODY} fill={`url(#${gid('metal')})`} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M362,380 L360,462" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="2.4" strokeLinecap="round" />
      <ellipse cx="380" cy="362" rx={def.rimRx} ry={def.rimRy} fill={color} stroke={INK} strokeWidth="2" />
      <ellipse cx="380" cy="362" rx={def.rimRx - 6} ry={Math.max(def.rimRy - 2.5, 2)} fill={INK} fillOpacity="0.3" stroke="none" />
    </g>
  )
}

export function VaseWithDecor(props: { kind: string; colorIdx: number; decor: DecorKey[] }) {
  return (
    <>
      <VaseGraphic {...props} />
      <VaseDecor decor={props.decor} />
    </>
  )
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

export const Z: Record<Role, number> = { foliage: 0, spike: 1, focal: 2, standard: 3, filler: 4 }
const zval = (f: Placed): number => f.z ?? Z[FLOWER_DEFS[f.kind].role]

/* ---------- studio ---------- */

export interface Placed {
  id: number
  kind: Kind
  colorIdx: number
  spray?: string
  z?: number
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
const LIGHT_KEY = 'huayuji-light-v1'
const CRAYON_KEY = 'huayuji-crayon-v1'
const VASE_KIND_KEY = 'huayuji-vase-kind-v1'
const VASE_COLOR_KEY = 'huayuji-vase-color-v1'
const VASE_DECOR_KEY = 'huayuji-vase-decor-v1'
const MAX_STEMS = 26

let nextId = 1

export default function Studio() {
  const { user, token } = useAuth()
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
  const [lightKey, setLightKey] = useState<string>(() => localStorage.getItem(LIGHT_KEY) ?? 'studio')
  const [crayon, setCrayon] = useState<boolean>(() => localStorage.getItem(CRAYON_KEY) === '1')
  const [vaseKind, setVaseKind] = useState<string>(() => localStorage.getItem(VASE_KIND_KEY) ?? VASE_KINDS[0].key)
  const [vaseColorIdx, setVaseColorIdx] = useState<number>(() => Number(localStorage.getItem(VASE_COLOR_KEY) ?? 0))
  const [vaseDecor, setVaseDecor] = useState<DecorKey[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(VASE_DECOR_KEY) ?? '[]')
    } catch {
      return []
    }
  })
  const [selected, setSelected] = useState<number | null>(null)
  const [note, setNote] = useState<Note | null>(null)
  const [limitNote, setLimitNote] = useState<number | null>(null)
  const [description, setDescription] = useState<{ name: string; blurb: string } | null>(null)
  const [descLoading, setDescLoading] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)
  const [captionDraft, setCaptionDraft] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [publishedLink, setPublishedLink] = useState<string | null>(null)
  const [copyOk, setCopyOk] = useState(false)
  const [petalRain, setPetalRain] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const dragRef = useRef<{ id: number; moved: boolean } | null>(null)
  const noteTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const limitTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const theme = THEMES.find((t) => t.key === themeKey) ?? THEMES[0]
  const light = LIGHTS.find((l) => l.key === lightKey) ?? LIGHTS[0]

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(placed)) }, [placed])
  useEffect(() => { localStorage.setItem(THEME_KEY, themeKey) }, [themeKey])
  useEffect(() => { localStorage.setItem(LIGHT_KEY, lightKey) }, [lightKey])
  useEffect(() => { localStorage.setItem(CRAYON_KEY, crayon ? '1' : '0') }, [crayon])
  useEffect(() => { localStorage.setItem(VASE_KIND_KEY, vaseKind) }, [vaseKind])
  useEffect(() => { localStorage.setItem(VASE_COLOR_KEY, String(vaseColorIdx)) }, [vaseColorIdx])
  useEffect(() => { localStorage.setItem(VASE_DECOR_KEY, JSON.stringify(vaseDecor)) }, [vaseDecor])

  function cycleVaseKind() {
    setVaseKind((k) => {
      const idx = VASE_KINDS.findIndex((v) => v.key === k)
      const next = VASE_KINDS[(idx + 1) % VASE_KINDS.length]
      setVaseColorIdx((c) => Math.min(c, next.palette.length - 1))
      return next.key
    })
  }

  function toggleDecor(key: DecorKey) {
    setVaseDecor((d) => (d.includes(key) ? d.filter((x) => x !== key) : [...d, key]))
  }

  function showNote(kind: Kind) {
    const def = FLOWER_DEFS[kind]
    clearTimeout(noteTimer.current)
    setNote({ key: Date.now(), label: def.label, huayu: def.huayu, role: ROLE_LABEL[def.role] })
    noteTimer.current = setTimeout(() => setNote(null), 4200)
  }

  function showLimitNote() {
    clearTimeout(limitTimer.current)
    setLimitNote(Date.now())
    limitTimer.current = setTimeout(() => setLimitNote(null), 2600)
  }

  function pickColor(kind: Kind): number {
    const def = FLOWER_DEFS[kind]
    if (theme.targets.length === 0) return Math.floor(Math.random() * def.palette.length)
    return bestPaletteIdx(def.palette, theme.targets).idx
  }

  function addFlower(kind: Kind) {
    if (placed.length >= MAX_STEMS) {
      showLimitNote()
      return
    }
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
    setDescription(null)
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
    setPlaced((p) => p.map((f) => (f.id === id ? { ...f, colorIdx: idx, spray: undefined } : f)))
  }

  function setSpray(id: number, color: string | undefined) {
    setPlaced((p) => p.map((f) => (f.id === id ? { ...f, spray: color } : f)))
  }

  function bringFront(id: number) {
    setPlaced((p) => {
      const max = Math.max(...p.map(zval))
      return p.map((f) => (f.id === id ? { ...f, z: max + 1 } : f))
    })
  }

  function sendBack(id: number) {
    setPlaced((p) => {
      const min = Math.min(...p.map(zval))
      return p.map((f) => (f.id === id ? { ...f, z: min - 1 } : f))
    })
  }

  function remove(id: number) {
    setPlaced((p) => p.filter((f) => f.id !== id))
    setSelected(null)
  }

  function clearAll() {
    setPlaced([])
    setSelected(null)
    setDescription(null)
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

  async function askDescribe() {
    if (placed.length === 0 || descLoading) return
    const counts = new Map<string, number>()
    for (const f of placed) {
      const label = FLOWER_DEFS[f.kind].label
      counts.set(label, (counts.get(label) ?? 0) + 1)
    }
    const desc = [...counts.entries()].map(([n, c]) => `${n}x${c}`).join(',')
    const q = theme.targets.length ? `主题:${theme.label};${desc}` : desc
    setDescLoading(true)
    setDescription(null)
    try {
      const url = new URL('/describe', API_BASE)
      url.searchParams.set('q', q)
      const res = await fetch(url)
      if (!res.ok) throw new Error(`${res.status}`)
      const data = await res.json()
      setDescription({ name: data.name, blurb: data.blurb })
      setPetalRain(true)
      setTimeout(() => setPetalRain(false), 7000)
    } catch {
      setDescription({ name: '此刻无题', blurb: '花艺师暂时联系不上,稍后再试试吧(后端服务开着吗?)' })
    } finally {
      setDescLoading(false)
    }
  }

  async function publish() {
    if (!user || placed.length === 0 || publishing) return
    setPublishing(true)
    setPublishError(null)
    try {
      const snapshot = { placed, vaseKind, vaseColorIdx, vaseDecor, themeKey, lightKey, crayon }
      const res = await fetch(new URL('/gallery/posts', API_BASE), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader(token) },
        body: JSON.stringify({ caption: captionDraft.trim(), snapshot }),
      })
      if (!res.ok) throw new Error(`请求失败: ${res.status}`)
      const data = await res.json()
      setPublishedLink(`${window.location.origin}${window.location.pathname}?post=${data.id}`)
      setCopyOk(false)
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setPublishing(false)
    }
  }

  async function copyPublishedLink() {
    if (!publishedLink) return
    try {
      await navigator.clipboard.writeText(publishedLink)
      setCopyOk(true)
      setTimeout(() => setCopyOk(false), 2000)
    } catch {
      setPublishError('复制失败,链接就在上面,手动选中复制吧')
    }
  }

  const selectedFlower = placed.find((f) => f.id === selected)
  const vaseKindDef = VASE_KINDS.find((v) => v.key === vaseKind) ?? VASE_KINDS[0]
  const drawOrder = [...placed].sort((a, b) => {
    const za = zval(a)
    const zb = zval(b)
    if (za !== zb) return za - zb
    return a.y - b.y
  })

  return (
    <div className="studio">
      {limitNote && (
        <div className="limit-toast" key={limitNote}>
          这一瓶已经满啦(最多 {MAX_STEMS} 枝)· 摘掉几枝再试试
        </div>
      )}

      <p className="studio-hint">
        从花架摘花入瓶 · 大花做焦点 / 碎花填空 / 叶材收边 · 拖动花头弯枝 · 点选后可换色 / 喷漆 / 调前后层级
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

      {/* lighting + texture */}
      <div className="theme-bar">
        <span className="theme-bar-label">打光</span>
        {LIGHTS.map((l) => (
          <button
            key={l.key}
            type="button"
            className={l.key === lightKey ? 'theme-chip on' : 'theme-chip'}
            onClick={() => setLightKey(l.key)}
          >
            {l.label}
          </button>
        ))}
        <button
          type="button"
          className={crayon ? 'theme-chip on' : 'theme-chip'}
          onClick={() => setCrayon((c) => !c)}
          style={{ marginLeft: '0.4rem' }}
        >
          ✎ 蜡笔质感
        </button>
      </div>

      {/* container */}
      <div className="theme-bar vase-bar">
        <span className="theme-bar-label">容器</span>
        {VASE_KINDS.map((v) => (
          <button
            key={v.key}
            type="button"
            className={v.key === vaseKind ? 'theme-chip vase-chip on' : 'theme-chip vase-chip'}
            onClick={() => { setVaseKind(v.key); setVaseColorIdx((c) => Math.min(c, v.palette.length - 1)) }}
            title={v.label}
          >
            <svg viewBox="322 354 116 138" width="30" height="36" aria-hidden="true">
              <VaseGraphic kind={v.key} colorIdx={0} />
            </svg>
            {v.label}
          </button>
        ))}
        {vaseKindDef.palette.length > 1 && (
          <>
            <span className="toolbar-div" />
            {vaseKindDef.palette.map((c, i) => (
              <button
                key={c}
                type="button"
                className={i === vaseColorIdx ? 'swatch on' : 'swatch'}
                style={{ background: c }}
                onClick={() => setVaseColorIdx(i)}
                aria-label={`容器颜色 ${i + 1}`}
              />
            ))}
          </>
        )}
      </div>

      <div className="theme-bar">
        <span className="theme-bar-label">装饰</span>
        {DECORATIONS.map((d) => (
          <button
            key={d.key}
            type="button"
            className={vaseDecor.includes(d.key) ? 'theme-chip on' : 'theme-chip'}
            onClick={() => toggleDecor(d.key)}
          >
            {d.label}
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

      <div className={light.dark ? 'canvas-wrap dark' : 'canvas-wrap'} style={{ background: light.bg }}>
        <svg
          ref={svgRef}
          viewBox="0 0 760 520"
          className="studio-canvas"
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerDown={() => setSelected(null)}
        >
          <defs>
            <filter id="crayon" x="-8%" y="-8%" width="116%" height="116%">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
          <path d="M30,486 C230,480 530,480 730,486" fill="none" stroke={light.dark ? '#6b6355' : INK} strokeWidth="2" strokeLinecap="round" opacity="0.5" />

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
          <g className="vase" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); cycleVaseKind() }}>
            <VaseWithDecor kind={vaseKind} colorIdx={vaseColorIdx} decor={vaseDecor} />
          </g>

          {/* blooms */}
          {drawOrder.map((f) => {
            const sc = FLOWER_DEFS[f.kind].scale
            const base = FLOWER_DEFS[f.kind].palette[f.colorIdx]
            const col = f.spray ? mixHex(base, f.spray, 0.5) : base
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
                  filter={crayon ? 'url(#crayon)' : undefined}
                  onPointerDown={(e) => onBloomDown(e, f.id)}
                  onDoubleClick={() => remove(f.id)}
                >
                  {selected === f.id && <circle r="30" fill="none" stroke={light.dark ? '#cbb9a0' : INK} strokeWidth="1.4" strokeDasharray="4 5" opacity="0.6" />}
                  <Bloom kind={f.kind} color={col} />
                  {f.spray === '#d9b45a' && (
                    <g>
                      {[[-8, -10], [6, -14], [12, 2], [-4, 8], [2, -2]].map(([dx, dy], i) => (
                        <circle key={i} cx={dx} cy={dy} r="1.1" fill="#f4d97a" stroke="none" opacity="0.9" />
                      ))}
                    </g>
                  )}
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

        {light.overlay !== 'none' && (
          <div
            className="light-overlay"
            aria-hidden="true"
            style={{ background: light.overlay, mixBlendMode: light.blend as CSSProperties['mixBlendMode'] }}
          />
        )}

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
                className={i === selectedFlower.colorIdx && !selectedFlower.spray ? 'swatch on' : 'swatch'}
                style={{ background: c }}
                onClick={() => setColor(selectedFlower.id, i)}
                aria-label={`颜色 ${i + 1}`}
              />
            ))}
            <span className="toolbar-div" />
            <span className="toolbar-tag">喷漆</span>
            {SPRAYS.map((sp) => (
              <button
                key={sp.key}
                type="button"
                className={selectedFlower.spray === sp.color ? 'swatch spray on' : 'swatch spray'}
                style={{ background: sp.color }}
                onClick={() => setSpray(selectedFlower.id, selectedFlower.spray === sp.color ? undefined : sp.color)}
                title={sp.label}
                aria-label={`喷漆 ${sp.label}`}
              />
            ))}
            <span className="toolbar-div" />
            <button type="button" className="toolbar-btn" onClick={() => bringFront(selectedFlower.id)} title="移到最前">置前</button>
            <button type="button" className="toolbar-btn" onClick={() => sendBack(selectedFlower.id)} title="压到最后">置后</button>
            <button type="button" className="toolbar-btn" onClick={() => remove(selectedFlower.id)}>取走</button>
          </div>
        )}
      </div>

      <div className="studio-actions">
        <button type="button" className="ink-btn" onClick={askDescribe} disabled={placed.length === 0 || descLoading}>
          {descLoading ? '文案构思中…' : '生成花束介绍语'}
        </button>
        {theme.targets.length > 0 && (
          <button type="button" className="ink-btn ghost" onClick={recolorToTheme} disabled={placed.length === 0}>
            按主题配色
          </button>
        )}
        <button type="button" className="ink-btn ghost" onClick={clearAll} disabled={placed.length === 0}>
          重新来过
        </button>
        <button
          type="button"
          className="ink-btn ghost"
          onClick={() => { setPublishOpen((o) => !o); setPublishedLink(null); setPublishError(null) }}
          disabled={placed.length === 0}
        >
          发布到集市
        </button>
      </div>

      {description && (
        <section className="note critique-note">
          <div className="note-label">花束名片</div>
          <p className="note-text bouquet-name">{description.name}</p>
          <p className="note-text">{description.blurb}</p>
        </section>
      )}

      {publishOpen && (
        <section className="note publish-note">
          {!publishedLink ? (
            <>
              <div className="note-label">发布到集市</div>
              {!user ? (
                <p className="hint">先登录才能发布到集市 · 用右上角的「登录 / 注册」</p>
              ) : (
                <div className="publish-fields">
                  <input
                    type="text"
                    className="publish-input"
                    placeholder="说两句这束花的心意(可不填)"
                    value={captionDraft}
                    onChange={(e) => setCaptionDraft(e.target.value)}
                    maxLength={300}
                  />
                  <button type="button" className="ink-btn" onClick={publish} disabled={publishing}>
                    {publishing ? '发布中…' : '确认发布'}
                  </button>
                </div>
              )}
              {publishError && <p className="error">{publishError}</p>}
            </>
          ) : (
            <>
              <div className="note-label">已发布</div>
              <p className="note-text">别人打开这个链接就能看到你插的这瓶花。</p>
              <div className="publish-fields">
                <input type="text" className="publish-input" readOnly value={publishedLink} onFocus={(e) => e.target.select()} />
                <button type="button" className="ink-btn" onClick={copyPublishedLink}>
                  {copyOk ? '已复制' : '复制链接'}
                </button>
              </div>
              <p className="hint">目前只在这台机器、这个本地服务上有效,还不是能发给别人打开的公网链接</p>
            </>
          )}
        </section>
      )}
    </div>
  )
}

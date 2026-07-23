import type { CSSProperties } from 'react'
import { Bloom, FLOWER_DEFS, INK, LIGHTS, VASE_COLORS, Z, mixHex, type Placed } from './Studio'

export interface Snapshot {
  placed: Placed[]
  vaseIdx: number
  themeKey?: string
  lightKey: string
  crayon: boolean
}

const zval = (f: Placed): number => f.z ?? Z[FLOWER_DEFS[f.kind].role]

/** Read-only render of a saved arrangement — no drag, no selection, no toolbar.
 *  Deliberately duplicates Studio's vase/bloom drawing instead of sharing a
 *  component, since Studio's canvas is tightly coupled to its interactive
 *  state; see docs/agent-design.md-style note in the gallery plan. */
export default function ArrangementView({ snapshot }: { snapshot: Snapshot }) {
  const light = LIGHTS.find((l) => l.key === snapshot.lightKey) ?? LIGHTS[0]
  const vaseColor = VASE_COLORS[snapshot.vaseIdx] ?? VASE_COLORS[0]
  const drawOrder = [...snapshot.placed].sort((a, b) => {
    const za = zval(a)
    const zb = zval(b)
    if (za !== zb) return za - zb
    return a.y - b.y
  })

  return (
    <div className="arrangement-view" style={{ background: light.bg }}>
      <svg viewBox="0 0 760 520" className="arrangement-svg">
        <defs>
          <filter id="crayon-ro" x="-8%" y="-8%" width="116%" height="116%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <path d="M30,486 C230,480 530,480 730,486" fill="none" stroke={light.dark ? '#6b6355' : INK} strokeWidth="2" strokeLinecap="round" opacity="0.5" />

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

        <g>
          <path
            d="M332,362 C330,368 334,372 341,373 C329,402 325,442 342,468 C353,487 407,487 418,468 C435,442 431,402 419,373 C426,372 430,368 428,362 Z"
            fill={vaseColor} fillOpacity="0.92" stroke={INK} strokeWidth="2.2" strokeLinejoin="round"
          />
          <ellipse cx="380" cy="362" rx="48" ry="7" fill={vaseColor} stroke={INK} strokeWidth="2" />
          <path d="M348,430 C350,448 356,462 366,470" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="4" strokeLinecap="round" />
        </g>

        {drawOrder.map((f) => {
          const def = FLOWER_DEFS[f.kind]
          const base = def.palette[f.colorIdx] ?? def.palette[0]
          const col = f.spray ? mixHex(base, f.spray, 0.5) : base
          return (
            <g
              key={f.id}
              className="sway"
              style={{ transformOrigin: `${f.ax}px ${f.ay}px`, animationDuration: `${f.swayDur}s`, animationDelay: `${f.swayDelay}s` }}
            >
              <g transform={`translate(${f.x} ${f.y}) scale(${def.scale})`} filter={snapshot.crayon ? 'url(#crayon-ro)' : undefined}>
                <Bloom kind={f.kind} color={col} />
              </g>
            </g>
          )
        })}

        {snapshot.placed.length === 0 && (
          <text x="380" y="250" textAnchor="middle" className="canvas-empty">这瓶还是空的</text>
        )}
      </svg>

      {light.overlay !== 'none' && (
        <div className="light-overlay" style={{ background: light.overlay, mixBlendMode: light.blend as CSSProperties['mixBlendMode'] }} />
      )}
    </div>
  )
}

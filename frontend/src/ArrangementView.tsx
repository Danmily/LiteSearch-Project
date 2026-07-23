import type { CSSProperties } from 'react'
import { Bloom, FLOWER_DEFS, INK, LIGHTS, VASE_KINDS, VaseWithDecor, Z, mixHex, type DecorKey, type Placed } from './Studio'

export interface Snapshot {
  placed: Placed[]
  vaseKind?: string
  vaseColorIdx?: number
  vaseDecor?: DecorKey[]
  /** legacy field from before the container system existed; ignored if present */
  vaseIdx?: number
  themeKey?: string
  lightKey: string
  crayon: boolean
}

const zval = (f: Placed): number => f.z ?? Z[FLOWER_DEFS[f.kind].role]

/** Read-only render of a saved arrangement — no drag, no selection, no toolbar.
 *  Deliberately duplicates Studio's bloom-drawing shell (not the flowers or
 *  the vase, both of which are shared components) instead of reusing Studio's
 *  interactive canvas, since that canvas is tightly coupled to its drag/
 *  selection state; see the gallery feature's design notes. */
export default function ArrangementView({ snapshot }: { snapshot: Snapshot }) {
  const light = LIGHTS.find((l) => l.key === snapshot.lightKey) ?? LIGHTS[0]
  const vaseKind = snapshot.vaseKind && VASE_KINDS.some((v) => v.key === snapshot.vaseKind) ? snapshot.vaseKind : VASE_KINDS[0].key
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

        <VaseWithDecor kind={vaseKind} colorIdx={snapshot.vaseColorIdx ?? 0} decor={snapshot.vaseDecor ?? []} />

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

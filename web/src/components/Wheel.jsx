import React from 'react'
import { motion } from 'framer-motion'
import useStore from '../store/useStore'

function polarToCartesian(cx, cy, radius, angleDeg) {
  const angleRad = (angleDeg - 90) * (Math.PI / 180.0)
  return { x: cx + radius * Math.cos(angleRad), y: cy + radius * Math.sin(angleRad) }
}

export default function Wheel({ items = [] }) {
  const size = 480
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 40
  const select = useStore((s) => s.select)
  const selected = useStore((s) => s.selected)

  const sliceAngle = items.length ? 360 / items.length : 360

  // compute rotation so selected mid angle goes to top (90deg)
  let rotate = 0
  if (selected) {
    const idx = items.findIndex(it => it.id === selected)
    if (idx >= 0) {
      const mid = idx * sliceAngle + sliceAngle / 2
      rotate = 90 - mid
    }
  }

  return (
    <div className="wheel-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <motion.g animate={{ rotate }} transformOrigin={`${cx}px ${cy}px`} style={{ transformBox: 'fill-box' }}>
          {items.map((it, i) => {
            const startAngle = i * sliceAngle
            const midAngle = startAngle + sliceAngle / 2
            const p1 = polarToCartesian(cx, cy, r, startAngle)
            const p2 = polarToCartesian(cx, cy, r, startAngle + sliceAngle)
            const path = `M ${cx} ${cy} L ${p1.x} ${p1.y} A ${r} ${r} 0 0 1 ${p2.x} ${p2.y} Z`
            const isSel = selected === it.id
            const isCompleted = Boolean(it.completed)
            return (
              <g key={it.id} transform={`rotate(${midAngle}, ${cx}, ${cy})`}>
                <motion.path
                  d={path}
                  fill={isSel ? '#FFD166' : isCompleted ? '#34d399' : '#6C9BD1'}
                  stroke="#ffffff"
                  strokeWidth="1"
                  style={{ filter: isSel ? 'url(#glow)' : 'none', cursor: 'pointer', opacity: isCompleted ? 0.8 : 1 }}
                  onClick={() => select(it.id)}
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                />
                <text x={cx + (r - 60)} y={cy} transform={`rotate(0, ${cx + (r - 60)}, ${cy})`} textAnchor="middle" alignmentBaseline="middle" style={{ pointerEvents: 'none', fontSize: 14, fill: '#fff' }}>
                  {it.name}
                </text>
              </g>
            )
          })}
        </motion.g>
      </svg>
      <div className="wheel-center" onClick={() => { if (selected) select(null) }}>
        {selected ? <div>Selected</div> : <div>Tap a sector</div>}
      </div>
    </div>
  )
}

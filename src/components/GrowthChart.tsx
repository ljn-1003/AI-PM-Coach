import { dimensions } from '../data/dimensions'
import type { AbilitySnapshot } from '../lib/session'

interface Props {
  snapshots: AbilitySnapshot[]
}

const W = 640
const H = 320
const PAD_L = 40
const PAD_R = 16
const PAD_T = 20
const PAD_B = 36
const PLOT_W = W - PAD_L - PAD_R
const PLOT_H = H - PAD_T - PAD_B

/** 六维度分数随测评次数变化的折线图 */
export function GrowthChart({ snapshots }: Props) {
  const n = snapshots.length
  const xAt = (i: number) => PAD_L + (i * PLOT_W) / Math.max(1, n - 1)
  const yAt = (v: number) => PAD_T + PLOT_H - (v * PLOT_H) / 100

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Y 轴网格 + 刻度 */}
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line
              x1={PAD_L}
              y1={yAt(v)}
              x2={W - PAD_R}
              y2={yAt(v)}
              stroke="var(--color-line)"
              strokeWidth={1}
            />
            <text
              x={PAD_L - 6}
              y={yAt(v)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={12}
              fill="var(--color-muted)"
            >
              {v}
            </text>
          </g>
        ))}

        {/* 六条维度折线 */}
        {dimensions.map((d) => {
          const pts = snapshots
            .map((s, i) => `${xAt(i).toFixed(1)},${yAt(s.scores[d.id] ?? 0).toFixed(1)}`)
            .join(' ')
          return (
            <polyline
              key={d.id}
              points={pts}
              fill="none"
              stroke={d.color}
              strokeWidth={2}
              strokeLinejoin="round"
            />
          )
        })}

        {/* 顶点 */}
        {dimensions.map((d) =>
          snapshots.map((s, i) => (
            <circle
              key={`${d.id}-${i}`}
              cx={xAt(i)}
              cy={yAt(s.scores[d.id] ?? 0)}
              r={3}
              fill={d.color}
            />
          )),
        )}

        {/* X 轴日期 */}
        {snapshots.map((s, i) => (
          <text
            key={i}
            x={xAt(i)}
            y={H - PAD_B + 18}
            textAnchor="middle"
            fontSize={11}
            fill="var(--color-muted)"
          >
            {new Date(s.date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
          </text>
        ))}
      </svg>

      {/* 图例 */}
      <div className="mt-2 flex flex-wrap gap-3">
        {dimensions.map((d) => (
          <span key={d.id} className="flex items-center gap-1 text-xs" style={{ color: d.color }}>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
            {d.name}
          </span>
        ))}
      </div>
    </div>
  )
}

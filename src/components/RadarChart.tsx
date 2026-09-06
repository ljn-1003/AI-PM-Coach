interface RadarDatum {
  label: string
  value: number // 0–100
  color: string // 维度低饱和色
}

interface RadarChartProps {
  data: RadarDatum[]
  /** 上次快照，浅灰虚线叠加（复测对比用） */
  compareData?: RadarDatum[]
  /** 点击某个维度顶点/分数时回调（分数解释弹窗用） */
  onPointClick?: (index: number) => void
}

const RINGS = [20, 40, 60, 80, 100]
const SIZE = 640
const CX = SIZE / 2
const CY = SIZE / 2
const RADIUS = 118
const LABEL_OFFSET = 32

/** 纯 SVG 六边形雷达图：六维度低饱和色 + 强项绿/弱项橙轴线提示 */
export function RadarChart({ data, compareData, onPointClick }: RadarChartProps) {
  const n = data.length
  const angleAt = (i: number) => -Math.PI / 2 + i * ((2 * Math.PI) / n)
  const pointAt = (i: number, value: number) => {
    const angle = angleAt(i)
    const dist = (RADIUS * value) / 100
    return { x: CX + dist * Math.cos(angle), y: CY + dist * Math.sin(angle) }
  }
  const ringPoints = (value: number) =>
    data
      .map((_, i) => {
        const p = pointAt(i, value)
        return `${p.x.toFixed(1)},${p.y.toFixed(1)}`
      })
      .join(' ')

  const dataPoints = data.map((d, i) => pointAt(i, d.value))

  // 轴线提示：>80 绿（强项），<60 橙（弱项），其余中性
  const hintColor = (value: number) => {
    if (value > 80) return 'var(--color-strong)'
    if (value < 60) return 'var(--color-weak)'
    return 'var(--color-line)'
  }

  const anchorFor = (i: number) => {
    const cos = Math.cos(angleAt(i))
    if (cos > 0.35) return 'start'
    if (cos < -0.35) return 'end'
    return 'middle'
  }
  const baselineFor = (i: number) => {
    const sin = Math.sin(angleAt(i))
    if (sin < -0.35) return 'text-after-edge'
    if (sin > 0.35) return 'hanging'
    return 'middle'
  }
  const labelPos = (i: number) => {
    const angle = angleAt(i)
    const dist = RADIUS + LABEL_OFFSET
    return { x: CX + dist * Math.cos(angle), y: CY + dist * Math.sin(angle) }
  }

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="mx-auto w-full max-w-[600px]"
      role="img"
      aria-label="六维度能力雷达图"
    >
      {/* 网格环 */}
      {RINGS.map((ring) => (
        <polygon
          key={`ring-${ring}`}
          points={ringPoints(ring)}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth={1}
        />
      ))}

      {/* 轴线（强项绿 / 弱项橙提示） */}
      {data.map((d, i) => {
        const p = pointAt(i, 100)
        return (
          <line
            key={`axis-${i}`}
            x1={CX}
            y1={CY}
            x2={p.x}
            y2={p.y}
            stroke={hintColor(d.value)}
            strokeWidth={1.5}
          />
        )
      })}

      {/* 数据多边形（本次：主色实线 + 半透明填充） */}
      <polygon
        points={dataPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
        fill="var(--color-primary)"
        fillOpacity={compareData ? 0.3 : 0.12}
        stroke="var(--color-primary)"
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* 上次数据多边形（浅灰虚线、不填充，画在上层保证可见） */}
      {compareData && (
        <polygon
          points={compareData.map((d, i) => {
            const p = pointAt(i, d.value)
            return `${p.x.toFixed(1)},${p.y.toFixed(1)}`
          }).join(' ')}
          fill="none"
          stroke="var(--color-muted)"
          strokeWidth={2}
          strokeDasharray="6 5"
          strokeLinejoin="round"
        />
      )}

      {/* 数据顶点（维度色） */}
      {dataPoints.map((p, i) => (
        <circle
          key={`dot-${i}`}
          cx={p.x}
          cy={p.y}
          r={8}
          fill={data[i].color}
          onClick={onPointClick ? () => onPointClick(i) : undefined}
          style={onPointClick ? { cursor: 'pointer' } : undefined}
        />
      ))}

      {/* 分数标注（顶点内侧） */}
      {data.map((d, i) => {
        const angle = angleAt(i)
        const dist = (RADIUS * d.value) / 100 - 24
        return (
          <text
            key={`score-${i}`}
            x={CX + dist * Math.cos(angle)}
            y={CY + dist * Math.sin(angle)}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={22}
            fontWeight={600}
            fill="var(--color-ink)"
            onClick={onPointClick ? () => onPointClick(i) : undefined}
            style={onPointClick ? { cursor: 'pointer' } : undefined}
          >
            {d.value}
          </text>
        )
      })}

      {/* 维度标签（顶点外侧，维度色） */}
      {data.map((d, i) => {
        const pos = labelPos(i)
        return (
          <text
            key={`label-${i}`}
            x={pos.x}
            y={pos.y}
            textAnchor={anchorFor(i)}
            dominantBaseline={baselineFor(i)}
            fontSize={25}
            fill={d.color}
          >
            {d.label}
          </text>
        )
      })}
    </svg>
  )
}

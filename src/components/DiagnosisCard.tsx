import { useState } from 'react'
import { generateResources } from '../lib/diagnose'
import type { Diagnosis, Resource } from '../lib/diagnose'

interface Props {
  name: string
  score: number
  diagnosis: Diagnosis | null
  loading: boolean
  insufficient: boolean
  onExpand: () => void
  /** 诊断未引用题号时，请求重新生成 */
  onRegenerate?: () => void
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-strong'
  if (score >= 60) return 'text-primary'
  return 'text-weak'
}

function ResourceSection({ dimensionName, points }: { dimensionName: string; points: string[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resources, setResources] = useState<Resource[]>([])

  async function toggle() {
    if (open) {
      setOpen(false)
      return
    }
    setOpen(true)
    if (resources.length === 0) {
      setLoading(true)
      const res = await generateResources(dimensionName, points)
      setResources(res)
      setLoading(false)
    }
  }

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={toggle}
        className="text-sm font-medium text-muted hover:text-ink"
      >
        {open ? '收起推荐资源' : '查看推荐资源'}
      </button>

      {open && loading && <p className="mt-3 text-sm text-muted">正在为你匹配学习资源…</p>}

      {open && !loading && (
        <ul className="mt-3 flex flex-col gap-3">
          {resources.map((r, i) => (
            <li key={i} className="rounded-lg border border-line bg-white p-4">
              <div className="flex items-start gap-2">
                <span className="font-medium text-ink">{r.title}</span>
                <span className="mt-0.5 shrink-0 rounded-full border border-line px-2 py-0.5 text-xs text-muted">
                  {r.type}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted">
                {r.platform} · {r.duration}
              </p>
              <p className="mt-2 text-sm text-muted">{r.reason}</p>
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(r.searchQuery)}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-sm text-primary transition-colors hover:border-primary"
              >
                用这个关键词搜索 → <span className="font-medium">{r.searchQuery}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function DiagnosisCard({
  name,
  score,
  diagnosis,
  loading,
  insufficient,
  onExpand,
  onRegenerate,
}: Props) {
  const color = scoreColor(score)

  // 折叠态：未展开、非加载、非数据不足
  if (!diagnosis && !loading && !insufficient) {
    return (
      <div className="rounded-lg border border-line bg-card p-5">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-ink">{name}</span>
          <span className={`text-2xl font-bold ${color}`}>{score}</span>
        </div>
        <button
          type="button"
          onClick={onExpand}
          className="mt-4 text-sm font-medium text-primary hover:underline"
        >
          展开查看诊断
        </button>
      </div>
    )
  }

  // 加载中
  if (loading) {
    return (
      <div className="rounded-lg border border-line bg-card p-5">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-ink">{name}</span>
          <span className={`text-2xl font-bold ${color}`}>{score}</span>
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          AI 正在为你生成针对性诊断（约 3 秒）
        </div>
      </div>
    )
  }

  // 数据不足
  if (insufficient) {
    return (
      <div className="rounded-lg border border-line bg-card p-5">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-ink">{name}</span>
          <span className={`text-2xl font-bold ${color}`}>{score}</span>
        </div>
        <p className="mt-4 text-sm text-muted">
          这个维度的答题数据不足以生成诊断，建议你做一次专项测评。
        </p>
      </div>
    )
  }

  // 完整诊断
  if (!diagnosis) return null
  return (
    <div className="rounded-lg border border-line bg-card p-5 sm:p-6">
      {/* 顶部：维度名 + 分数 + 降级标记 */}
      <div className="flex items-start justify-between">
        <div className="flex items-baseline gap-3">
          <span className="font-semibold text-ink">{name}</span>
          <span className={`text-3xl font-bold ${color}`}>{score}分</span>
        </div>
        {diagnosis.fallback && <span className="text-xs text-muted/70">（基础诊断）</span>}
      </div>

      {/* 一句话总结 */}
      <p className="mt-4 text-lg font-medium text-primary">{diagnosis.summary}</p>

      {/* 未引用具体题号时的警告 */}
      {diagnosis.missingCitation && (
        <div className="mt-3 flex items-center gap-2 rounded bg-weak/10 px-3 py-2 text-xs text-weak">
          <span>诊断未引用具体题号</span>
          {onRegenerate && (
            <button type="button" onClick={onRegenerate} className="font-medium underline">
              重新生成
            </button>
          )}
        </div>
      )}

      {/* 薄弱点列表 */}
      {diagnosis.weakPoints.map((wp, i) => (
        <div key={i} className="mt-5">
          <p className="font-semibold text-ink">{wp.title}</p>
          {wp.evidence && (
            <div className="mt-2 rounded bg-line/60 px-3 py-2 text-sm text-ink">{wp.evidence}</div>
          )}
          {wp.reason && <p className="mt-2 text-sm text-muted">{wp.reason}</p>}
          {wp.advice && <p className="mt-2 text-sm font-semibold text-primary">→ {wp.advice}</p>}
        </div>
      ))}

      {/* 鼓励语 */}
      <div className="mt-6 rounded-lg border border-strong/40 p-4">
        <p className="text-sm text-strong">{diagnosis.encouragement}</p>
      </div>

      {/* 学习资源推荐 */}
      <ResourceSection
        dimensionName={name}
        points={diagnosis.weakPoints.map((wp) => wp.title)}
      />
    </div>
  )
}

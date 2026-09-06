import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { GrowthChart } from '../components/GrowthChart'
import { RadarChart } from '../components/RadarChart'
import { dimensions } from '../data/dimensions'
import { clearSession, loadSnapshots } from '../lib/session'
import type { AbilitySnapshot } from '../lib/session'

const DAY = 86400000

function daysSince(date: string): number {
  const t = new Date(date).getTime()
  if (Number.isNaN(t)) return 0
  return Math.floor((Date.now() - t) / DAY)
}

function radarData(s: AbilitySnapshot) {
  return dimensions.map((d) => ({ label: d.name, value: s.scores[d.id] ?? 0, color: d.color }))
}

export default function Dashboard() {
  const snapshots = loadSnapshots()
  const navigate = useNavigate()
  const [showHistory, setShowHistory] = useState(false)

  if (snapshots.length === 0) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold text-ink">还没有测评记录</h1>
        <p className="mt-3 text-muted">完成一次测评后，这里会显示你的能力成长。</p>
        <Button to="/intro" className="mt-8">
          开始第一次测评
        </Button>
      </main>
    )
  }

  const latest = snapshots[snapshots.length - 1]
  const prev = snapshots.length >= 2 ? snapshots[snapshots.length - 2] : null
  const days = daysSince(latest.date)

  const retakeText =
    days < 3
      ? '建议再过几天复测，让学习有时间发挥作用。'
      : days > 14
        ? `已经 ${days} 天没测评了，回来看看自己的水平吧。`
        : `距离上次测评 ${days} 天，来复测一次看看进步。`

  function startRetake() {
    clearSession()
    navigate('/quiz')
  }

  // 三个关键数字
  let totalDiff = 0
  let bestDim: { name: string; diff: number } | null = null
  let worstDim: { name: string; score: number } | null = null
  for (const d of dimensions) {
    const cur = latest.scores[d.id] ?? 0
    if (!worstDim || cur < worstDim.score) worstDim = { name: d.name, score: cur }
    if (prev) {
      const diff = cur - (prev.scores[d.id] ?? 0)
      if (!bestDim || diff > bestDim.diff) bestDim = { name: d.name, diff }
    }
  }
  if (prev) totalDiff = latest.totalScore - prev.totalScore

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-10">
      {/* 顶部：标题 + 复测按钮 */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">我的成长</h1>
          <p className="mt-1 text-sm text-muted">记录每一次测评，看到自己的进步</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Button
            onClick={startRetake}
            className={
              days < 3 ? 'opacity-50' : days > 14 ? 'ring-2 ring-primary/30 ring-offset-2' : ''
            }
          >
            立即复测
          </Button>
          <p className="max-w-[180px] text-right text-xs text-muted">{retakeText}</p>
        </div>
      </div>

      {/* 雷达图：单或对比 */}
      <div className="mt-10">
        {prev ? (
          <RadarChart data={radarData(latest)} compareData={radarData(prev)} />
        ) : (
          <RadarChart data={radarData(latest)} />
        )}
      </div>

      {/* 快照提示 / 三个数字 */}
      {prev ? (
        <div className="mt-8 flex flex-col gap-3">
          <div className="flex items-center justify-between rounded-lg border border-line bg-card p-4">
            <span className="text-sm text-muted">总分变化</span>
            <span className="font-medium text-ink">
              上次 {prev.totalScore} 分 → 本次 {latest.totalScore} 分
              <span className={totalDiff >= 0 ? 'text-strong' : 'text-weak'}>
                （{totalDiff >= 0 ? '+' : ''}
                {totalDiff}）
              </span>
            </span>
          </div>
          {bestDim && bestDim.diff > 0 && (
            <div className="flex items-center justify-between rounded-lg border border-line bg-card p-4">
              <span className="text-sm text-muted">提升最大</span>
              <span className="font-medium text-strong">
                {bestDim.name} 提升了 {bestDim.diff} 分
              </span>
            </div>
          )}
          {worstDim && (
            <div className="flex items-center justify-between rounded-lg border border-line bg-card p-4">
              <span className="text-sm text-muted">仍需加强</span>
              <span className="font-medium text-ink">{worstDim.name} 仍是你的弱项</span>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-8 rounded-lg border border-line bg-card p-5 text-center">
          <p className="text-sm text-muted">完成下一次测评后，你可以看到自己的进步对比。</p>
          <Button onClick={startRetake} className="mt-4">
            立即复测
          </Button>
        </div>
      )}

      {/* 成长折线图（≥2 快照，每个维度一条折线） */}
      {snapshots.length >= 2 && (
        <div className="mt-8">
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="text-sm font-medium text-primary hover:underline"
          >
            {showHistory ? '收起成长曲线' : '查看成长曲线'}
          </button>
          {showHistory && (
            <div className="mt-4 rounded-lg border border-line bg-card p-4">
              <GrowthChart snapshots={snapshots} />
            </div>
          )}
        </div>
      )}
    </main>
  )
}

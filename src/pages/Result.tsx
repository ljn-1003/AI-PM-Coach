import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { DiagnosisCard } from '../components/DiagnosisCard'
import { RadarChart } from '../components/RadarChart'
import { ScoreModal } from '../components/ScoreModal'
import { dimensions } from '../data/dimensions'
import { computeResult, computeTotalScore, levelOf } from '../data/result'
import type { ResultItem } from '../data/result'
import { questionBank } from '../data/questionBank'
import { MIN_QUESTIONS_FOR_DIAGNOSIS, generateDiagnosis } from '../lib/diagnose'
import type { Diagnosis, DiagnosisInput } from '../lib/diagnose'
import { clearSession, loadSession, loadSnapshots } from '../lib/session'

const byId = new Map(questionBank.map((q) => [q.id, q]))

interface DimState {
  loading: boolean
  data: Diagnosis | null
  insufficient: boolean
}

export default function Result() {
  const session = loadSession()
  const navigate = useNavigate()
  const hasAnswers = session !== null && Object.values(session.answers).length > 0
  const [dims, setDims] = useState<Record<number, DimState>>({})
  const [showWrong, setShowWrong] = useState(false)
  const [scoreModal, setScoreModal] = useState<{
    name: string
    color: string
    score: number
    answered: number
    highDifficulty: number
    correct: number
    wrong: number
  } | null>(null)

  // 首屏只生成最弱维度的诊断，其余折叠，点开才生成
  useEffect(() => {
    if (!session) return
    const results = computeResult(session.ids, session.answers)
    if (results.length === 0) return
    const weakest = [...results].sort((a, b) => a.score - b.score)[0]
    void loadDiagnosis(weakest)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!session || !hasAnswers) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold text-ink">还没有答题记录</h1>
        <p className="mt-3 text-muted">先去完成一轮测评，再来查看你的能力雷达图。</p>
        <Button to="/intro" className="mt-8">
          开始测评
        </Button>
      </main>
    )
  }

  const results = computeResult(session.ids, session.answers)
  const totalScore = computeTotalScore(results)
  const totalLevel = levelOf(totalScore)
  const radarData = results.map((r) => ({ label: r.name, value: r.score, color: r.color }))

  // 复测对比反馈（与上一次快照比较）
  const snapshots = loadSnapshots()
  const wrongList = Object.values(session.answers).filter(
    (a) => a.answerIndex !== null && a.answerIndex !== a.correctIndex,
  )
  type Feedback = { kind: 'up' | 'breakthrough' | 'down' | 'flat'; title: string; detail?: string }
  let feedback: Feedback | null = null
  if (snapshots.length >= 2) {
    const latest = snapshots[snapshots.length - 1]
    const prev = snapshots[snapshots.length - 2]
    const totalDiff = latest.totalScore - prev.totalScore
    const days = Math.max(
      0,
      Math.round((new Date(latest.date).getTime() - new Date(prev.date).getTime()) / 86400000),
    )
    let maxDim = { name: '', diff: 0 }
    let weakest = { name: '', score: 101 }
    for (const d of dimensions) {
      const diff = (latest.scores[d.id] ?? 0) - (prev.scores[d.id] ?? 0)
      if (diff > maxDim.diff) maxDim = { name: d.name, diff }
      const cur = latest.scores[d.id] ?? 0
      if (cur < weakest.score) weakest = { name: d.name, score: cur }
    }
    if (totalDiff < -5) {
      feedback = {
        kind: 'down',
        title: '今天的表现可能不在最佳状态。',
        detail: '我们一起回顾这次答错的题，看看是哪里出了问题。',
      }
    } else if (totalDiff >= 10) {
      feedback = { kind: 'up', title: `你在 ${days} 天里提升了 ${totalDiff} 分！` }
    } else if (maxDim.diff >= 15) {
      feedback = {
        kind: 'breakthrough',
        title: `你的【${maxDim.name}】维度突破了！`,
        detail: `单项提升了 ${maxDim.diff} 分`,
      }
    } else {
      feedback = {
        kind: 'flat',
        title: '本次表现稳定。',
        detail: `建议针对【${weakest.name}】做专项练习，下次会有突破。`,
      }
    }
  }

  function buildInput(item: ResultItem): DiagnosisInput {
    const questions = Object.values(session!.answers)
      .filter((a) => a.dimensionId === item.id && a.answerIndex !== null)
      .map((a) => {
        const q = byId.get(a.questionId)
        return {
          id: a.questionId,
          order: session!.ids.indexOf(a.questionId) + 1,
          difficulty: q?.difficulty ?? 3,
          focus: q?.focus ?? '',
          stem: (q?.stem ?? '').slice(0, 60),
          correct: a.answerIndex === a.correctIndex,
        }
      })
    return { dimensionId: item.id, name: item.name, score: item.score, questions }
  }

  async function loadDiagnosis(item: ResultItem) {
    setDims((prev) => ({ ...prev, [item.id]: { loading: true, data: null, insufficient: false } }))
    const input = buildInput(item)
    if (input.questions.length < MIN_QUESTIONS_FOR_DIAGNOSIS) {
      setDims((prev) => ({ ...prev, [item.id]: { loading: false, data: null, insufficient: true } }))
      return
    }
    const data = await generateDiagnosis(input)
    setDims((prev) => ({ ...prev, [item.id]: { loading: false, data, insufficient: false } }))
  }

  function openScoreModal(item: ResultItem) {
    const list = Object.values(session!.answers).filter(
      (a) => a.dimensionId === item.id && a.answerIndex !== null,
    )
    let correct = 0
    let high = 0
    for (const a of list) {
      if (a.answerIndex === a.correctIndex) correct++
      const q = byId.get(a.questionId)
      if (q && q.difficulty >= 4) high++
    }
    setScoreModal({
      name: item.name,
      color: item.color,
      score: item.score,
      answered: list.length,
      highDifficulty: high,
      correct,
      wrong: list.length - correct,
    })
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-12">
      {/* 顶部：总分 + 定性评价 */}
      <header className="text-center">
        <p className="text-sm text-muted">你的 AI PM 综合能力</p>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight text-ink">
          {totalScore}分
          <span className="ml-3 text-2xl font-medium text-muted">· {totalLevel}</span>
        </h1>
      </header>

      {/* 复测反馈卡片 */}
      {feedback && (
        <div
          className={`mx-auto mt-6 max-w-2xl rounded-lg p-5 ${
            feedback.kind === 'up' || feedback.kind === 'breakthrough'
              ? 'bg-primary text-white'
              : feedback.kind === 'down'
                ? 'border border-weak/50 bg-white'
                : 'border border-line bg-card'
          }`}
        >
          <p
            className={`text-lg font-medium ${
              feedback.kind === 'up' || feedback.kind === 'breakthrough' ? 'text-white' : 'text-ink'
            }`}
          >
            {feedback.title}
          </p>
          {feedback.detail && (
            <p
              className={`mt-1 text-sm ${
                feedback.kind === 'up' || feedback.kind === 'breakthrough'
                  ? 'text-white/80'
                  : 'text-muted'
              }`}
            >
              {feedback.detail}
            </p>
          )}
          {feedback.kind === 'down' && (
            <>
              <button
                type="button"
                onClick={() => setShowWrong((v) => !v)}
                className="mt-3 text-sm font-medium text-weak hover:underline"
              >
                {showWrong ? '收起本次错题' : '查看本次错题'}
              </button>
              {showWrong && (
                <ul className="mt-3 flex flex-col gap-2">
                  {wrongList.map((a, i) => {
                    const q = byId.get(a.questionId)
                    return (
                      <li key={i} className="rounded bg-line/50 px-3 py-2 text-left text-sm">
                        <span className="font-medium text-ink">#{a.questionId}</span>
                        <span className="text-ink"> {q?.stem?.slice(0, 40) ?? ''}…</span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </>
          )}
        </div>
      )}

      {/* 雷达图 */}
      <div className="mx-auto mt-10 max-w-2xl">
        <RadarChart data={radarData} onPointClick={(i) => openScoreModal(results[i])} />
      </div>

      {/* 逐维度诊断卡片 */}
      <section className="mx-auto mt-12 flex max-w-2xl flex-col gap-4">
        <h2 className="text-lg font-semibold text-ink">你的弱点诊断</h2>
        {results.map((r) => {
          const d = dims[r.id]
          return (
            <DiagnosisCard
              key={r.id}
              name={r.name}
              score={r.score}
              diagnosis={d?.data ?? null}
              loading={d?.loading ?? false}
              insufficient={d?.insufficient ?? false}
              onExpand={() => void loadDiagnosis(r)}
              onRegenerate={() => void loadDiagnosis(r)}
            />
          )
        })}
      </section>

      {/* 底部：复测入口 + 成长对比 */}
      <div className="mt-14 flex flex-col items-center gap-3">
        <Button
          onClick={() => {
            clearSession()
            navigate('/quiz')
          }}
          className="w-full max-w-xs"
        >
          立即复测
        </Button>
        <Button to="/dashboard" className="w-full max-w-xs bg-transparent text-primary hover:bg-primary/5">
          查看我的成长对比
        </Button>
      </div>

      {/* 分数构成解释弹窗 */}
      {scoreModal && (
        <ScoreModal
          {...scoreModal}
          onClose={() => setScoreModal(null)}
          onRetake={() => {
            clearSession()
            navigate('/quiz')
          }}
        />
      )}
    </main>
  )
}

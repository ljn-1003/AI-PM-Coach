import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { dimensions } from '../data/dimensions'
import { questionBank } from '../data/questionBank'
import {
  TOTAL_QUESTIONS,
  buildPlan,
  contribution,
  createCatState,
  difficultyOf,
  pickQuestion,
  questionBankIssues,
  replayCat,
} from '../lib/cat'
import {
  appendHistory,
  appendSnapshot,
  clearSession,
  loadHistory,
  loadSession,
  saveSession,
} from '../lib/session'
import type { HistoryEntry, SessionAnswer } from '../lib/session'

const byId = new Map(questionBank.map((q) => [q.id, q]))

interface QuizState {
  plan: number[]
  ids: number[]
  answers: Record<number, SessionAnswer>
  startedAt: number
}

/** 历史答过的题号（跨测评累积），复测时优先避开 */
function answeredBeforeSet(): Set<number> {
  return new Set(loadHistory().map((h) => h.questionId))
}

/** 抽一套全新的 15 题 */
function freshQuiz(): QuizState {
  const plan = buildPlan()
  const state = createCatState()
  const first = pickQuestion(plan[0], state.difficulty[plan[0]], new Set(), answeredBeforeSet())
  return { plan, ids: first ? [first] : [], answers: {}, startedAt: Date.now() }
}

/** 检测是否有未完成的会话（plan 完整、没抽满 15 题、当前题未作答） */
function incompleteSession(): QuizState | null {
  const existing = loadSession()
  if (
    existing &&
    existing.plan?.length === TOTAL_QUESTIONS &&
    existing.ids.length > 0 &&
    existing.ids.length < TOTAL_QUESTIONS &&
    existing.answers[existing.ids[existing.ids.length - 1]] === undefined
  ) {
    return { plan: existing.plan, ids: existing.ids, answers: existing.answers, startedAt: existing.startedAt }
  }
  return null
}

export default function Quiz() {
  const navigate = useNavigate()
  const startRef = useRef(0)
  const finishedRef = useRef(false)
  const [issues] = useState(() => questionBankIssues())
  const [quiz, setQuiz] = useState<QuizState>(() => incompleteSession() ?? freshQuiz())
  const [showResume, setShowResume] = useState(() => incompleteSession() !== null)

  // 每次状态变化都写回 localStorage，保证刷新不丢
  useEffect(() => {
    saveSession({ plan: quiz.plan, ids: quiz.ids, answers: quiz.answers, startedAt: quiz.startedAt })
  }, [quiz])

  // 每题切入时重置计时起点
  useEffect(() => {
    startRef.current = Date.now()
  }, [quiz.ids.length])

  // 题库未就绪：某维度题目少于 3 道，禁止启动
  if (issues.length > 0) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="text-xl font-semibold text-ink">题库未就绪，请联系管理员</h1>
      </main>
    )
  }

  // 未完成测评的续答提示
  if (showResume) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-lg border border-line bg-card p-6 text-center">
          <h1 className="text-xl font-semibold text-ink">你有一次未完成的测评</h1>
          <p className="mt-3 text-sm text-muted">上次测到第 {quiz.ids.length} 题，是否继续作答？</p>
          <div className="mt-6 flex flex-col gap-3">
            <Button onClick={() => setShowResume(false)} className="w-full">
              继续
            </Button>
            <Button
              onClick={() => {
                clearSession()
                setQuiz(freshQuiz())
                setShowResume(false)
              }}
              className="w-full bg-transparent text-primary hover:bg-primary/5"
            >
              放弃重来
            </Button>
          </div>
        </div>
      </main>
    )
  }

  const index = quiz.ids.length - 1
  const questionId = quiz.ids[index]
  const question = questionId === undefined ? undefined : byId.get(questionId)
  const selected = questionId === undefined ? null : (quiz.answers[questionId]?.answerIndex ?? null)
  const dimension = dimensions.find((d) => d.id === question?.dimensionId)
  const categoryColor = dimension?.color ?? '#6b7280'
  const isLast = quiz.ids.length >= TOTAL_QUESTIONS

  function commit(answerIndex: number | null) {
    if (!question) return
    // 事件处理器内计时，非渲染期调用；oxlint react/purity 对此误报
    // oxlint-disable-next-line react/purity
    const timeSpentMs = Date.now() - startRef.current
    const nextAnswers: Record<number, SessionAnswer> = {
      ...quiz.answers,
      [questionId]: {
        questionId,
        dimensionId: question.dimensionId,
        answerIndex,
        correctIndex: question.correctIndex,
        timeSpentMs,
      },
    }
    setQuiz((prev) => ({ ...prev, answers: nextAnswers }))

    // 抽题决策 + 分数变化日志（跳过不计分）
    if (answerIndex !== null) {
      const state = replayCat(quiz.ids, quiz.answers)
      const diff = difficultyOf(questionId)
      const correct = answerIndex === question.correctIndex
      const contrib = contribution(correct, diff)
      const oldScore = state.score[question.dimensionId]
      const oldDiff = state.difficulty[question.dimensionId]
      const newScore = oldScore * 0.7 + contrib * 0.3
      const newDiff = Math.min(5, Math.max(1, oldDiff + (correct ? 1 : -1)))
      console.log(
        `[CAT] #${questionId} 维度「${question.dimensionId}」难度 ${diff} → ${correct ? '答对' : '答错'}：贡献 ${contrib}，分数 ${oldScore.toFixed(1)} → ${newScore.toFixed(1)}，难度 ${oldDiff} → ${newDiff}`,
      )
    }
  }

  function finish() {
    if (finishedRef.current) return
    finishedRef.current = true
    const finalState = replayCat(quiz.ids, quiz.answers)
    console.log(
      '[CAT] 测评结束，各维度分数：' +
        dimensions.map((d) => `${d.name} ${finalState.score[d.id].toFixed(1)}`).join('，'),
    )
    // 保存能力快照（答满 10 题才记，供复测对比）
    const answered = Object.values(quiz.answers)
    const answeredCount = answered.filter((a) => a.answerIndex !== null).length
    const correctCount = answered.filter((a) => a.answerIndex === a.correctIndex).length
    if (answeredCount >= 10) {
      const scores: Record<number, number> = {}
      let sum = 0
      for (const d of dimensions) {
        const s = Math.round(finalState.score[d.id])
        scores[d.id] = s
        sum += s
      }
      appendSnapshot({
        date: new Date().toISOString(),
        scores,
        totalScore: Math.round(sum / dimensions.length),
        answeredCount,
        correctCount,
      })
    }
    const entries: HistoryEntry[] = Object.values(quiz.answers).map((a) => ({
      questionId: a.questionId,
      dimensionId: a.dimensionId,
      answerIndex: a.answerIndex,
      correct: a.answerIndex === a.correctIndex,
      timeSpentMs: a.timeSpentMs,
      answeredAt: Date.now(),
    }))
    appendHistory(entries)
    navigate('/result')
  }

  function goNext() {
    if (quiz.ids.length >= TOTAL_QUESTIONS) {
      finish()
      return
    }
    const nextDim = quiz.plan[quiz.ids.length]
    const st = replayCat(quiz.ids, quiz.answers)
    const nextId = pickQuestion(nextDim, st.difficulty[nextDim], new Set(quiz.ids), answeredBeforeSet())
    if (nextId === null) {
      finish()
      return
    }
    setQuiz((prev) => ({ ...prev, ids: [...prev.ids, nextId] }))
  }

  function skip() {
    commit(null)
    goNext()
  }

  if (!question) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-2xl px-6 py-10 text-center text-muted">
        题库数据异常，请返回重新开始。
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-6 py-10">
      {/* 进度条 */}
      <div>
        <p className="text-sm text-muted">
          第 {index + 1} 题 / 共 {TOTAL_QUESTIONS} 题
        </p>
        <div className="mt-2 h-1.5 w-full rounded-full bg-line">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${(quiz.ids.length / TOTAL_QUESTIONS) * 100}%` }}
          />
        </div>
      </div>

      {/* 题目卡片 */}
      <div className="mt-8 rounded-lg bg-card p-6 sm:p-8">
        {/* 顶部小字：题号 + 维度 + 考核点 */}
        <p className="flex flex-wrap items-center gap-x-1 text-sm">
          <span className="font-medium text-muted">#{index + 1}</span>
          <span className="mx-0.5 text-muted">・</span>
          <span className="font-medium" style={{ color: categoryColor }}>
            {dimension?.name ?? '未分类'}
          </span>
        </p>

        {/* 题干：18–20px，行高 1.6，左对齐 */}
        <p className="mt-3 text-lg leading-[1.6] text-ink sm:text-xl">
          {question.stem}
        </p>

        {/* 选项 */}
        <div className="mt-6 flex flex-col gap-3">
          {question.options.map((option, i) => {
            const isSelected = selected === i
            return (
              <button
                key={i}
                type="button"
                onClick={() => commit(i)}
                className={`flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-line bg-white hover:border-primary'
                }`}
              >
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-sm font-medium transition-colors ${
                    isSelected ? 'bg-primary text-white' : 'border border-line text-muted'
                  }`}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-base leading-relaxed text-ink">{option}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 底部操作 */}
      <div className="mt-10 flex items-center gap-4">
        <Button onClick={goNext} disabled={selected === null} className="flex-1">
          {isLast ? '完成' : '下一题'}
        </Button>
        <button
          type="button"
          onClick={skip}
          className="shrink-0 text-sm text-muted hover:text-ink"
        >
          跳过本题
        </button>
      </div>
    </main>
  )
}

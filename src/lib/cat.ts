import { dimensions } from '../data/dimensions'
import { questionBank } from '../data/questionBank'
import type { SessionAnswer } from './session'

/** 固定 15 题：6 维各 2 题（12）+ 随机 3 维各 1 题（3） */
export const TOTAL_QUESTIONS = 15
const EXTRA_COUNT = 3

const INITIAL_DIFFICULTY = 3
const INITIAL_SCORE = 50
const MAX_DIFFICULTY = 5
const MIN_DIFFICULTY = 1

const byId = new Map(questionBank.map((q) => [q.id, q]))

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 生成 15 题的维度序列：每维 2 题 + 随机 3 维各 1 题，整体打乱 */
export function buildPlan(): number[] {
  const base = dimensions.flatMap((d) => [d.id, d.id])
  const extra = shuffle(dimensions.map((d) => d.id)).slice(0, EXTRA_COUNT)
  return shuffle([...base, ...extra])
}

/** 读取题库真实难度 1–5（缺失兜底 3） */
export function difficultyOf(id: number): number {
  return byId.get(id)?.difficulty ?? INITIAL_DIFFICULTY
}

/** 本题对能力分的贡献（答对/答错 × 难度档），取区间中值 */
export function contribution(correct: boolean, difficulty: number): number {
  if (correct) {
    if (difficulty >= 4) return 95 // 90–100
    if (difficulty === 3) return 75 // 70–80
    return 55 // 50–60
  }
  if (difficulty >= 4) return 55 // 50–60
  if (difficulty === 3) return 45 // 40–50
  return 25 // 20–30
}

export interface CatState {
  difficulty: Record<number, number>
  score: Record<number, number>
}

export function createCatState(): CatState {
  const difficulty: Record<number, number> = {}
  const score: Record<number, number> = {}
  for (const d of dimensions) {
    difficulty[d.id] = INITIAL_DIFFICULTY
    score[d.id] = INITIAL_SCORE
  }
  return { difficulty, score }
}

/** 按答题顺序回放，得到当前 CAT 状态（各维度难度 + 能力分） */
export function replayCat(ids: number[], answers: Record<number, SessionAnswer>): CatState {
  const state = createCatState()
  for (const id of ids) {
    const a = answers[id]
    if (!a || a.answerIndex === null) continue
    const q = byId.get(id)
    if (!q) continue
    const correct = a.answerIndex === a.correctIndex
    const c = contribution(correct, q.difficulty)
    state.score[q.dimensionId] = state.score[q.dimensionId] * 0.7 + c * 0.3
    const delta = correct ? 1 : -1
    state.difficulty[q.dimensionId] = Math.min(
      MAX_DIFFICULTY,
      Math.max(MIN_DIFFICULTY, state.difficulty[q.dimensionId] + delta),
    )
  }
  return state
}

/** 抽某维度当前难度档的一题；优先避开历史答过的题，该档无题再降级为维度内随机 */
export function pickQuestion(
  dimensionId: number,
  difficulty: number,
  used: Set<number>,
  answeredBefore: Set<number> = new Set(),
): number | null {
  const fresh = (q: { id: number; dimensionId: number; difficulty: number }) =>
    !used.has(q.id) && !answeredBefore.has(q.id)
  let pool = questionBank.filter(
    (q) => q.dimensionId === dimensionId && q.difficulty === difficulty && fresh(q),
  )
  if (pool.length === 0) {
    pool = questionBank.filter(
      (q) => q.dimensionId === dimensionId && q.difficulty === difficulty && !used.has(q.id),
    )
  }
  if (pool.length === 0) {
    pool = questionBank.filter((q) => q.dimensionId === dimensionId && !used.has(q.id))
  }
  if (pool.length === 0) return null
  const q = pool[Math.floor(Math.random() * pool.length)]
  console.log(
    `[CAT] 抽题 → 维度「${dimensionId}」难度 ${difficulty}，候选 ${pool.length} 题，抽中 #${q.id}（难度 ${q.difficulty}）`,
  )
  return q.id
}

/** 返回题目少于 3 道的维度 id 列表；空数组 = 题库就绪 */
export function questionBankIssues(): number[] {
  const count: Record<number, number> = {}
  for (const q of questionBank) count[q.dimensionId] = (count[q.dimensionId] ?? 0) + 1
  return dimensions.filter((d) => (count[d.id] ?? 0) < 3).map((d) => d.id)
}

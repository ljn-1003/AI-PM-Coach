/** localStorage 持久化：当前答题会话 + 累积答题历史。页面只通过这里读写，不直接碰 localStorage。 */

export interface SessionAnswer {
  questionId: number
  dimensionId: number
  /** 用户选的下标；null = 跳过本题 */
  answerIndex: number | null
  correctIndex: number
  timeSpentMs: number
}

export interface Session {
  /** 本轮 15 题的维度序列（每维 2 题 + 随机 3 题） */
  plan: number[]
  /** 本轮已抽中的题号（按答题顺序） */
  ids: number[]
  /** key = 题号 */
  answers: Record<number, SessionAnswer>
  startedAt: number
}

export interface HistoryEntry {
  questionId: number
  dimensionId: number
  answerIndex: number | null
  correct: boolean
  timeSpentMs: number
  answeredAt: number
}

const SESSION_KEY = 'ai-pm-coach:session'
const HISTORY_KEY = 'ai-pm-coach:history'

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as Session
    // 防崩溃：校验字段形状，旧版本/损坏数据一律视为无会话（下游统一走空态）
    if (
      !data ||
      !Array.isArray(data.plan) ||
      !Array.isArray(data.ids) ||
      !data.answers ||
      typeof data.answers !== 'object'
    ) {
      return null
    }
    return data
  } catch {
    return null
  }
}

export function saveSession(session: Session): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    // localStorage 不可用（隐私模式/配额满）时静默降级
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // 忽略
  }
}

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const list = JSON.parse(raw)
    if (!Array.isArray(list)) return []
    return list.filter((e) => e && typeof e.questionId === 'number')
  } catch {
    return []
  }
}

export function appendHistory(entries: HistoryEntry[]): void {
  try {
    const history = loadHistory()
    history.push(...entries)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  } catch {
    // 忽略
  }
}

// ---- 能力快照（复测对比） ----

export interface AbilitySnapshot {
  /** ISO 时间 */
  date: string
  /** dimensionId -> 得分（0–100，整数） */
  scores: Record<number, number>
  totalScore: number
  answeredCount: number
  correctCount: number
}

const SNAPSHOTS_KEY = 'ai-pm-coach:snapshots'

export function loadSnapshots(): AbilitySnapshot[] {
  try {
    const raw = localStorage.getItem(SNAPSHOTS_KEY)
    if (!raw) return []
    const list = JSON.parse(raw)
    if (!Array.isArray(list)) return []
    // 防崩溃：过滤掉日期非法或 scores 缺失的脏数据，避免下游出现 NaN 天 / undefined 读取
    return list.filter(
      (s) =>
        s &&
        typeof s.date === 'string' &&
        !Number.isNaN(new Date(s.date).getTime()) &&
        s.scores &&
        typeof s.scores === 'object',
    )
  } catch {
    return []
  }
}

export function appendSnapshot(snapshot: AbilitySnapshot): void {
  try {
    const list = loadSnapshots()
    list.push(snapshot)
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(list))
  } catch {
    // 忽略
  }
}

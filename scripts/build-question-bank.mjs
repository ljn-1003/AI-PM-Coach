// 把根目录《AI产品经理面试题库_标注版_含考察点.md》解析成 src/data/questionBank.ts
// 用法：npm run build:questions
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const mdPath = join(root, 'AI产品经理面试题库_标注版_含考察点.md')
const outPath = join(root, 'src', 'data', 'questionBank.ts')

const md = readFileSync(mdPath, 'utf8')

// 「类型」→ 维度 id（与 src/data/dimensions.ts 一一对应）
const TYPE_TO_DIM = {
  AI技术理解: 1,
  产品设计: 2,
  数据与评估: 3,
  用户洞察: 4,
  商业化思维: 5,
  工程协作与落地: 6,
}

// 按「**题目**：」切题，第一段是文件头
const blocks = md.split('**题目**：').slice(1)

function parseBlock(block) {
  const stem = (block.match(/^([\s\S]*?)\n\*\*考察点\*\*：/) ?? [])[1]?.trim() ?? ''
  const focus = (block.match(/\*\*考察点\*\*：([^\n]+)/) ?? [])[1]?.trim() ?? ''
  const type = (block.match(/\*\*类型\*\*：([^\n]+)/) ?? [])[1]?.trim() ?? ''
  const optionsRaw = (block.match(/\*\*选项\*\*：\n([\s\S]*?)\n\*\*正确答案\*\*：/) ?? [])[1] ?? ''
  const options = [...optionsRaw.matchAll(/^[A-D][.、]\s*(.+)$/gm)].map((m) => m[1].trim())
  const ans = (block.match(/\*\*正确答案\*\*：\s*([A-D])/) ?? [])[1] ?? ''
  const correctIndex = ans ? ans.charCodeAt(0) - 65 : -1
  const diff = (block.match(/\*\*难度\*\*：([1-5])分/) ?? [])[1] ?? ''
  const difficulty = diff ? Number(diff) : 3
  const explanation = (block.match(/\*\*解析\*\*：\n([\s\S]*)/) ?? [])[1]?.split('\n---')[0]?.trim() ?? ''
  return { stem, focus, type, options, correctIndex, difficulty, explanation }
}

const questions = []
const failures = []
for (let i = 0; i < blocks.length; i++) {
  const id = i + 1
  const p = parseBlock(blocks[i])
  const dimensionId = TYPE_TO_DIM[p.type]
  if (p.options.length !== 4 || p.correctIndex < 0 || p.correctIndex > 3) {
    failures.push({ id, reason: `选项${p.options.length}个/答案${p.correctIndex}`, type: p.type })
    continue
  }
  if (dimensionId === undefined) {
    failures.push({ id, reason: `未知类型「${p.type}」`, type: p.type })
    continue
  }
  questions.push({
    id,
    stem: p.stem,
    focus: p.focus,
    options: p.options,
    correctIndex: p.correctIndex,
    dimensionId,
    difficulty: p.difficulty,
    explanation: p.explanation,
  })
}

const dist = {}
for (const q of questions) dist[q.dimensionId] = (dist[q.dimensionId] ?? 0) + 1

console.log(`解析完成：${questions.length} 道题`)
console.log('维度分布:', JSON.stringify(dist))
if (failures.length) console.log('解析失败:', JSON.stringify(failures))

const header = `// 本文件由 scripts/build-question-bank.mjs 自动生成，请勿手改。
// 重新生成：npm run build:questions

export interface BankQuestion {
  /** 原题号 1-${blocks.length}，稳定 ID */
  id: number
  stem: string
  /** 考察点：本题考察的能力点（来自题库标注） */
  focus: string
  /** 固定 4 个选项 */
  options: string[]
  /** 正确答案下标 */
  correctIndex: number
  /** 所属维度 id，对应 dimensions.ts 的 id */
  dimensionId: number
  /** 难度 1–5，来自原题库「难度：X分」 */
  difficulty: number
  /** 原题库「解析」（正确选项分析 + 错误选项分析） */
  explanation: string
}

export const questionBank: BankQuestion[] = `

const body = questions
  .map(
    (q) =>
      `  { id: ${q.id}, stem: ${JSON.stringify(q.stem)}, focus: ${JSON.stringify(q.focus)}, options: ${JSON.stringify(q.options)}, correctIndex: ${q.correctIndex}, dimensionId: ${q.dimensionId}, difficulty: ${q.difficulty}, explanation: ${JSON.stringify(q.explanation)} },`,
  )
  .join('\n')

writeFileSync(outPath, header + '[\n' + body + '\n]\n', 'utf8')
console.log('已写出:', outPath)

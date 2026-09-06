// 把根目录《AI产品经理--面试题库_问题与参考答案.md》切成 529 道题的行区间清单
// 产出 scripts/reannotate/manifest.json：[{ id, section, localNum, title, startLine, endLine }]
// 用法：node scripts/prepare-reannotation.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const mdPath = join(root, 'AI产品经理--面试题库_问题与参考答案.md')
const outDir = join(__dirname, 'reannotate')
const outPath = join(outDir, 'manifest.jsonl')

const lines = readFileSync(mdPath, 'utf8').split(/\r?\n/)

// 标题匹配：`## 数字、标题`（杂项如 `## 角色及限制条件` 因不以数字开头而自动排除）
const headerRe = /^## ([0-9]+)、(.*)$/

const headers = []
for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(headerRe)
  if (m) headers.push({ line: i + 1, num: Number(m[1]), title: m[2].trim() })
}

// 章节：题号从 1 重数时，section 自增
let section = 0
let prevNum = Infinity
const manifest = headers.map((h, idx) => {
  if (h.num <= prevNum) section++
  prevNum = h.num
  const endLine = idx + 1 < headers.length ? headers[idx + 1].line - 1 : lines.length
  return {
    id: idx + 1,
    section,
    localNum: h.num,
    title: h.title,
    startLine: h.line,
    endLine,
  }
})

mkdirSync(outDir, { recursive: true })
// JSONL：一行一题，行号 = 扁平 id，方便工作流 agent 按行区间读取
writeFileSync(outPath, manifest.map((m) => JSON.stringify(m)).join('\n') + '\n', 'utf8')

// 统计
const secCount = {}
for (const m of manifest) secCount[m.section] = (secCount[m.section] ?? 0) + 1
console.log(`共切出 ${manifest.length} 道题，写入 ${outPath}`)
console.log('章节分布:', JSON.stringify(secCount))
console.log('首题:', JSON.stringify(manifest[0]))
console.log('末题:', JSON.stringify(manifest[manifest.length - 1]))

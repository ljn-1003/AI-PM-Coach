// 弱点诊断：按维度生成个性化诊断。优先调用 Claude，失败重试 1s/3s，仍失败走本地降级文本。

export interface QuestionInfo {
  id: number
  /** 本轮测评内的顺序题号（1–15），诊断引用用这个而非题库全局 id */
  order: number
  difficulty: number
  /** 考察点：本题考察的能力点（来自题库标注） */
  focus: string
  /** 题干（截断），供 AI 生成证据摘要时引用 */
  stem: string
  correct: boolean
}

export interface DiagnosisInput {
  dimensionId: number
  name: string
  score: number
  questions: QuestionInfo[]
}

export interface WeakPoint {
  title: string
  evidence: string
  reason: string
  advice: string
}

export interface Diagnosis {
  summary: string
  weakPoints: WeakPoint[]
  encouragement: string
  fallback: boolean
  /** AI 返回了但没引用具体题号（前端据此提示重新生成） */
  missingCitation?: boolean
}

export const MIN_QUESTIONS_FOR_DIAGNOSIS = 2

const MODEL = 'claude-sonnet-4-6'

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

// ---------------- 降级文本（6 维 × 4 档） ----------------

const FALLBACK: Record<number, Record<string, Diagnosis>> = {
  1: {
    '0-40': {
      summary: '你对大模型技术栈停留在概念层面，没有判断框架',
      weakPoints: [
        {
          title: 'RAG 与微调的适用边界',
          evidence: '多道涉及知识库、检索、微调的题目都选偏了',
          reason: '你可能缺少真实的 RAG 项目经验，把「数据越多」当成了万能解',
          advice: '先读 OpenAI 官方 RAG 实践指南，再自己跑通一个最小知识库问答 Demo',
        },
      ],
      encouragement: '最基础的概念题你没有丢分，说明底层认知是有的',
      fallback: true,
    },
    '40-60': {
      summary: '你能说出 RAG、微调这些词，但分不清各自适用场景',
      weakPoints: [
        {
          title: 'RAG 与微调选型',
          evidence: '在模型优化策略类题目上反复踩坑',
          reason: '你对「何时检索增强、何时动模型参数」缺乏一条清晰判断主线',
          advice: '把 OpenAI 官方文档里 RAG 和 fine-tuning 两章对照读一遍，列出各自的适用清单',
        },
      ],
      encouragement: '你能识别出核心概念，说明基础不是空白',
      fallback: true,
    },
    '60-80': {
      summary: '技术理解基本到位，但边界和量化判断偏弱',
      weakPoints: [
        {
          title: '多模态与成本量化',
          evidence: '涉及成本、多模态的题目有犹豫和误判',
          reason: '你对 token 成本、延迟与效果的量化权衡还不够敏感',
          advice: '用一次真实调用记录 token 消耗和延迟，建一张「效果-成本」对照表',
        },
      ],
      encouragement: '主链路（RAG/Prompt）你已经答得不错，基础扎实',
      fallback: true,
    },
    '80-100': {
      summary: '大模型技术理解扎实，可以挑战更前沿的话题',
      weakPoints: [],
      encouragement: '技术理解这一块你已经过关，可以往更深的地方走',
      fallback: true,
    },
  },
  2: {
    '0-40': {
      summary: '你把需求转成方案时缺少用户视角',
      weakPoints: [
        {
          title: '需求分析与 PRD',
          evidence: '需求拆解类题目大多没答到点子上',
          reason: '你更关注功能怎么做，而不是用户到底卡在哪一步',
          advice: '下次写 PRD 前，先列出 3 个真实用户场景再动笔',
        },
      ],
      encouragement: '你有把它落成具体方案的动作，这是好的起点',
      fallback: true,
    },
    '40-60': {
      summary: '能画原型，但对 AI 不确定性的设计预案不足',
      weakPoints: [
        {
          title: '异常兜底与加载态',
          evidence: '涉及 AI 输出不稳定时的设计题答得模糊',
          reason: '你可能习惯了确定性的交互，没把「模型会出错」当成设计前提',
          advice: '给你现在的 AI 产品补一份「失败/兜底」设计清单，逐条对照',
        },
      ],
      encouragement: '基础的交互设计题你答得不错',
      fallback: true,
    },
    '60-80': {
      summary: '产品设计基本功在，异常兜底和交互细节待补',
      weakPoints: [
        {
          title: '置信度与兜底提示',
          evidence: '对置信度提示、失败重试的设计题有遗漏',
          reason: '你对「AI 产品特有的不确定交互」考虑得还不够系统',
          advice: '研究 3 个成熟 AI 产品的异常态设计（如 ChatGPT、Notion AI）并做对比',
        },
      ],
      encouragement: '主流程设计你已经答得不错',
      fallback: true,
    },
    '80-100': {
      summary: '产品设计成熟，可以挑战多智能体编排等复杂场景',
      weakPoints: [],
      encouragement: '产品设计这块你已经很有章法',
      fallback: true,
    },
  },
  3: {
    '0-40': {
      summary: '你没有建立评估体系的意识，只凭感觉判断好坏',
      weakPoints: [
        {
          title: '评估体系设计',
          evidence: '涉及评测集、指标的题目基本都答错了',
          reason: '你可能从没亲手搭过评测集，对「离线评测」没有体感',
          advice: '从零搭一个 20 条样本的评测集，跑一次模型对比并记录指标',
        },
      ],
      encouragement: '你能意识到「要看效果」，方向是对的',
      fallback: true,
    },
    '40-60': {
      summary: '有指标意识，但分不清离线评测和线上指标',
      weakPoints: [
        {
          title: '离线/在线指标边界',
          evidence: '指标选用类题目反复混淆',
          reason: '你对哪些指标在评测阶段看、哪些上线后才看，没有清晰分层',
          advice: '画一张「离线→灰度→全量」各阶段的指标清单，贴在需求文档里',
        },
      ],
      encouragement: '你对基本指标有概念，这是能补起来的基础',
      fallback: true,
    },
    '60-80': {
      summary: '评估框架基本成形，AI 专属指标选用仍模糊',
      weakPoints: [
        {
          title: '幻觉率 / 召回率选用',
          evidence: 'AI 专属指标（幻觉率、召回率）的题目答得不准',
          reason: '你对这些指标「在什么场景下看哪个」还不够熟练',
          advice: '把「召回率、幻觉率、满意度」各配一个适用场景，写成备忘',
        },
      ],
      encouragement: '标准指标的评估题你答得不错',
      fallback: true,
    },
    '80-100': {
      summary: '评估体系扎实，可以挑战规模化评测自动化',
      weakPoints: [],
      encouragement: '评估这块你已经很有体系了',
      fallback: true,
    },
  },
  4: {
    '0-40': {
      summary: '你习惯从技术出发，而不是从用户的问题出发',
      weakPoints: [
        {
          title: '用户需求验证',
          evidence: '用户研究、需求真伪类题目基本答偏',
          reason: '你可能没做过正式的用户访谈，对「验证需求」没有方法',
          advice: '本周约 1 个真实用户聊 20 分钟，只问问题、不讲方案',
        },
      ],
      encouragement: '你有关注用户的想法，只是还没变成方法',
      fallback: true,
    },
    '40-60': {
      summary: '知道要做用户调研，但很少真的去验证需求',
      weakPoints: [
        {
          title: '用户访谈与场景挖掘',
          evidence: '用户访谈方法类题目答得模糊',
          reason: '你把「问用户」当成了形式，缺少结构化的访谈设计',
          advice: '用「5 个为什么」做一次用户访谈，记录卡点而不只记需求',
        },
      ],
      encouragement: '你有用户意识，这是最难补的部分，你已经有了一半',
      fallback: true,
    },
    '60-80': {
      summary: '用户意识在，但访谈和场景挖掘的方法论偏弱',
      weakPoints: [
        {
          title: '场景挖掘深度',
          evidence: '场景挖掘、需求优先级类题目有遗漏',
          reason: '你容易停在「用户想要什么」表层，没挖到「为什么」',
          advice: '学一个用户研究框架（如 JTBD），套到你现在负责的产品上练一次',
        },
      ],
      encouragement: '基础的用户洞察题你答得不错',
      fallback: true,
    },
    '80-100': {
      summary: '用户洞察敏锐，可以挑战高难度需求挖掘',
      weakPoints: [],
      encouragement: '用户洞察是你的强项，保持这个手感',
      fallback: true,
    },
  },
  5: {
    '0-40': {
      summary: '你对商业模式没有概念，只看功能不看价值',
      weakPoints: [
        {
          title: '商业模式与定价',
          evidence: '商业、ROI、定价类题目基本答错',
          reason: '你可能从没算过产品的账，对「谁来付费、为什么付费」没有体感',
          advice: '挑一个 AI 产品，写出它的单位经济模型（获客成本、token 成本、客单价）',
        },
      ],
      encouragement: '你能意识到要衡量价值，方向是对的',
      fallback: true,
    },
    '40-60': {
      summary: '知道要算账，但单位经济模型拆解不完整',
      weakPoints: [
        {
          title: '成本与 ROI 拆解',
          evidence: '成本、ROI 类题目答得片面',
          reason: '你对「提质、提效、减负」的价值量化还不熟练',
          advice: '用一张表拆解一个功能的 ROI：成本列 + 价值列，逐项填',
        },
      ],
      encouragement: '你对基本商业概念有认识，基础不差',
      fallback: true,
    },
    '60-80': {
      summary: '商业意识在，付费意愿验证和定价策略待加强',
      weakPoints: [
        {
          title: '付费意愿验证',
          evidence: '定价、变现类题目有犹豫',
          reason: '你缺少「先验证付费意愿再规模化」的框架',
          advice: '做一次最小付费测试：先问 10 个用户愿不愿意为它付费、付多少',
        },
      ],
      encouragement: '主流的商业题你答得不错',
      fallback: true,
    },
    '80-100': {
      summary: '商业化思维成熟，可以挑战定价与 GTM 策略',
      weakPoints: [],
      encouragement: '商业化思维是你的优势',
      fallback: true,
    },
  },
  6: {
    '0-40': {
      summary: '你在协作里容易被技术细节带跑，抓不住目标',
      weakPoints: [
        {
          title: '项目推动与目标管理',
          evidence: '项目管理、推动类题目答得偏',
          reason: '你可能在协作中习惯被动接活，缺少对目标和对齐的主动把控',
          advice: '下次开会前先写一句「本次要达成什么」，会后对齐谁做什么、何时交付',
        },
      ],
      encouragement: '你有协作意愿，这是落地的基础',
      fallback: true,
    },
    '40-60': {
      summary: '能推动项目，但技术债和上线风险预判不足',
      weakPoints: [
        {
          title: '风险与里程碑管理',
          evidence: '里程碑、风险类题目答得模糊',
          reason: '你更关注「做出来」，对延迟上线和技术债的预警不够敏感',
          advice: '在排期里显式加一列「风险与依赖」，每两周过一遍',
        },
      ],
      encouragement: '你对协作流程有基本概念',
      fallback: true,
    },
    '60-80': {
      summary: '协作顺畅，里程碑和优先级管理可再精细',
      weakPoints: [
        {
          title: '优先级与资源分配',
          evidence: '优先级、资源类题目有遗漏',
          reason: '你在多需求并行时，缺少一套清晰的优先级判断标准',
          advice: '用「价值 / 复杂度」二维矩阵给手上需求排一次序',
        },
      ],
      encouragement: '你的协作和节奏题答得不错',
      fallback: true,
    },
    '80-100': {
      summary: '落地能力强，可以挑战跨团队大型项目统筹',
      weakPoints: [],
      encouragement: '工程协作落地是你的强项',
      fallback: true,
    },
  },
}

function scoreBand(score: number): string {
  if (score >= 80) return '80-100'
  if (score >= 60) return '60-80'
  if (score >= 40) return '40-60'
  return '0-40'
}

function fallback(input: DiagnosisInput): Diagnosis {
  const base =
    FALLBACK[input.dimensionId]?.[scoreBand(input.score)] ??
    FALLBACK[input.dimensionId]?.['40-60'] ?? {
      summary: '这个维度暂无可用诊断',
      weakPoints: [],
      encouragement: '建议做一次专项测评。',
      fallback: true,
    }
  // 降级也尽量引用真实题号，避免「算命」感
  const wrongIds = input.questions.filter((q) => !q.correct).map((q) => q.order)
  const rightIds = input.questions.filter((q) => q.correct).map((q) => q.order)
  const wrongStr = wrongIds.length ? `第${wrongIds.join('、第')}题` : ''
  const rightStr = rightIds.length ? `第${rightIds.join('、第')}题` : ''
  return {
    ...base,
    weakPoints: base.weakPoints.map((wp) => ({
      ...wp,
      evidence: wrongStr ? `你在${wrongStr}答错` : wp.evidence,
    })),
    encouragement: rightStr
      ? `你在${rightStr}答得不错。${base.encouragement}`
      : base.encouragement,
  }
}

// ---------------- Prompt 构建 ----------------

function buildPrompt(input: DiagnosisInput): string {
  const lines = input.questions.map(
    (q) =>
      `第${q.order}题（难度${q.difficulty}，考察点：${q.focus || '未标注'}，${q.correct ? '答对' : '答错'}）题干：${q.stem}`,
  )
  const wrongIds = input.questions.filter((q) => !q.correct).map((q) => q.order)
  const rightIds = input.questions.filter((q) => q.correct).map((q) => q.order)
  const highScore = input.score >= 90

  return `你是一位有 8 年经验的资深 AI 产品经理面试官，见过大量候选人，能一眼看出什么是好答案、什么是有缺陷的答案。

你的任务：根据下面这位用户在「${input.name}」维度的答题数据，生成一份针对性诊断报告。

你会收到以下数据：
- 维度名：${input.name}
- 维度得分：${input.score} 分（满分 100）
- 用户在这个维度答过的题（含题号、考察点、难度、答对/答错）：
${lines.join('\n') || '（无）'}

请用结构化的中文段落输出，不要用 JSON、不要用代码块，就是一段段自然语言，方便前端直接展示。

${
  highScore
    ? `由于该维度得分超过 90，不需要薄弱点了，重心改成「已经掌握得很好，可以挑战哪些更难的话题」。`
    : ''
}

输出必须严格包含以下带方括号标签的段落，标签单独成行：

【总结】
一句话总结这个维度水平，30 字以内，要犀利不要圆滑。直接说问题（如「你对大模型选型缺乏判断框架」），禁止「还有提升空间」这类废话。

${highScore ? '【优势】\n列出 1-3 个可以挑战的更难话题，每个用「### 」开头，下面用：建议： 一行说明如何挑战。' : '【薄弱点】\n列出 1-3 个薄弱点，每个用「### 」开头，下面依次是：证据：/ 原因：/ 建议： 三行。'}

【鼓励】
一段鼓励，必须引用用户答对的具体题目（如「你在第 5 题判断 Token 成本权衡时答得很好」），不能空洞。

死规矩：
1. 不许说「有潜力但缺乏深度」「还有提升空间」这类废话。
2. 不许只说「建议多学习」，建议必须是立刻能开始的具体动作（可点名具体文档/章节/练习）。
3. 不许凭空推测原因，必须基于用户答错的题（${wrongIds.length ? `用户答错的题号是：第${wrongIds.join('、第')}题` : '用户本题维度没有答错题'}）。
4. 鼓励必须引用答对的具体题号（${rightIds.length ? `用户答对的题号是：第${rightIds.join('、第')}题` : '用户本题维度没有答对题'}）。
5. 薄弱点里的「证据」要引用具体题号并带一句题干摘要，格式如「你在第3题、第7题（关于RAG与微调选型）都搞错了……」。
6. 整个诊断必须至少引用 1 个具体题号（「第X题」），否则视为不合格。`
}

// ---------------- 调用 + 重试 + 降级 ----------------

async function callClaude(prompt: string): Promise<string> {
  const key = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined
  if (!key) throw new Error('no api key')
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return data.content?.[0]?.text ?? ''
}

function pick(text: string, tag: string): string {
  const i = text.indexOf(`【${tag}】`)
  if (i === -1) return ''
  return text.slice(i + tag.length + 3).trim()
}

function parse(text: string): Diagnosis | null {
  const summary = pick(text, '总结').split('\n')[0]?.trim() ?? ''
  const encouragement = pick(text, '鼓励').trim()

  const weakPoints: WeakPoint[] = []
  const wpSection = pick(text, '薄弱点')
  const advSection = pick(text, '优势')
  for (const part of (wpSection || advSection).split('### ').slice(1)) {
    const grab = (label: string) => {
      const m = part.match(new RegExp(`${label}：?([^\\n]+)`))
      return m ? m[1].trim() : ''
    }
    const title = part.split('\n')[0]?.trim() ?? ''
    if (title) {
      weakPoints.push({
        title,
        evidence: grab('证据'),
        reason: grab('原因'),
        advice: grab('建议'),
      })
    }
  }

  if (!summary && weakPoints.length === 0) return null
  return { summary, weakPoints, encouragement, fallback: false }
}

/** 诊断是否引用了具体题号（证据里出现「第X题」） */
export function hasQuestionCitation(d: Diagnosis): boolean {
  return (
    d.weakPoints.some((wp) => /第\d+题/.test(wp.evidence)) ||
    /第\d+题/.test(d.encouragement)
  )
}

export async function generateDiagnosis(input: DiagnosisInput): Promise<Diagnosis> {
  if (input.questions.length < MIN_QUESTIONS_FOR_DIAGNOSIS) {
    return {
      summary: '这个维度的答题数据不足以生成诊断',
      weakPoints: [],
      encouragement: '建议你做一次专项测评，补充更多该维度的答题样本。',
      fallback: true,
    }
  }
  const prompt = buildPrompt(input)
  for (let i = 0; i < 3; i++) {
    if (i > 0) await sleep(i === 1 ? 1000 : 3000)
    try {
      const text = await callClaude(prompt)
      const parsed = parse(text)
      if (parsed) return { ...parsed, missingCitation: !hasQuestionCitation(parsed) }
    } catch {
      // 重试，最后一次后走降级
    }
  }
  return fallback(input)
}

// ---------------- 学习资源推荐（AI 给搜索建议，不给 URL） ----------------

export interface Resource {
  title: string
  platform: string
  type: string
  duration: string
  reason: string
  searchQuery: string
}

const FALLBACK_RESOURCES: Resource[] = [
  { title: 'Building Systems with the ChatGPT API', platform: 'DeepLearning.AI', type: '课程', duration: '约 1 小时', reason: 'Andrew Ng 与 OpenAI 合开的实战课，覆盖 RAG、评估、成本权衡', searchQuery: 'DeepLearning.AI Building Systems ChatGPT API' },
  { title: 'Neural Networks: Zero to Hero', platform: 'YouTube · Andrej Karpathy', type: '视频', duration: '约 8 小时', reason: '从零写大模型，补齐底层直觉，理解模型能力边界', searchQuery: 'Karpathy Neural Networks Zero to Hero' },
  { title: 'Designing Machine Learning Systems', platform: "O'Reilly · Chip Huyen", type: '书', duration: '约 10 小时', reason: '覆盖评估、数据、部署，是 AI 产品落地的方法论书', searchQuery: 'Chip Huyen Designing Machine Learning Systems' },
  { title: 'Prompt Engineering Guide', platform: 'OpenAI 官方文档', type: '文章', duration: '约 30 分钟', reason: '官方 Prompt 最佳实践，直接可套用到产品里', searchQuery: 'OpenAI Prompt Engineering Guide' },
  { title: 'Anthropic Prompt Engineering Tutorial', platform: 'Anthropic 官方文档', type: '文章', duration: '约 40 分钟', reason: 'Anthropic 官方的 Prompt 工程交互教程，系统补齐提示词设计', searchQuery: 'Anthropic Prompt Engineering tutorial' },
  { title: 'Build a Large Language Model From Scratch', platform: 'Manning · Sebastian Raschka', type: '书', duration: '约 20 小时', reason: '手把手实现 LLM，搞懂 token、注意力、训练的本质', searchQuery: 'Sebastian Raschka Build LLM from scratch' },
]

function buildResourcePrompt(dimensionName: string, points: string[]): string {
  const pointStr = points.length ? points.join('、') : '该维度的通用能力'
  return `你是 AI 产品经理学习教练，熟悉行业内的优质学习资源。

任务：根据用户的弱点维度和具体考察点，推荐 3-5 个学习资源帮他补强。

输入：
- 弱点维度：${dimensionName}
- 具体考察点：${pointStr}

每个资源输出 6 个字段，用「### 」分隔每个资源，字段用「标题：/平台：/类型：/时长：/理由：/搜索：」标签。输出结构化中文段落，不要用 JSON、不要用代码块。

格式示例：
###
标题：xxx
平台：xxx
类型：课程
时长：约 1 小时
理由：xxx
搜索：xxx

死规矩：
1. 绝对不许输出任何 URL，一条都不行。
2. 只推荐稳定来源：知名作者（Andrew Ng、Karpathy、Chip Huyen 等）、大公司官方资源（OpenAI、Anthropic、Google AI 官方文档）、经典书籍。禁止知乎/掘金/CSDN 具体文章、不知名博主、刚发布的最新文章。
3. 搜索建议 3-6 个词，要具体到能定位资源，但又不能长到没人会输入。
4. 类型只能四选一：文章/视频/书/课程。`
}

function parseResources(text: string): Resource[] | null {
  const parts = text.split('### ').slice(1)
  const out: Resource[] = []
  for (const part of parts) {
    const grab = (label: string) => {
      const m = part.match(new RegExp(`${label}：?([^\\n]+)`))
      return m ? m[1].trim() : ''
    }
    const title = grab('标题')
    const platform = grab('平台')
    const type = grab('类型')
    const duration = grab('时长')
    const reason = grab('理由')
    const searchQuery = grab('搜索')
    if (title && searchQuery) {
      out.push({ title, platform, type, duration, reason, searchQuery })
    }
  }
  return out.length ? out : null
}

export async function generateResources(
  dimensionName: string,
  points: string[],
): Promise<Resource[]> {
  if (!(import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined)) return FALLBACK_RESOURCES
  const prompt = buildResourcePrompt(dimensionName, points)
  for (let i = 0; i < 3; i++) {
    if (i > 0) await sleep(i === 1 ? 1000 : 3000)
    try {
      const text = await callClaude(prompt)
      const parsed = parseResources(text)
      if (parsed) return parsed
    } catch {
      // 重试，最后一次后走降级
    }
  }
  return FALLBACK_RESOURCES
}

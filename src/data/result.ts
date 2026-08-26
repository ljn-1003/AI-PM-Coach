import { dimensions } from './dimensions'

export interface ResultItem {
  name: string
  color: string
  score: number
  diagnosis: string
}

// 模拟分数（对应 6 个维度的顺序：AI 技术理解 / 产品设计 / 数据与评估 / 用户洞察 / 商业化思维 / 工程协作与落地）
const scores = [85, 72, 65, 45, 58, 70]

const diagnoses = [
  '大模型选型和能力边界的判断扎实，能分清 RAG 与微调的适用场景。但多模态与成本优化的量化分析偏弱，复杂选型时容易凭经验而非数据下判断。',
  '需求拆解和 PRD 基本功扎实，能把模糊需求落成清晰的用户故事。但对 AI 输出不确定性的设计预案不足，异常兜底、加载态与置信度提示考虑得不够系统。',
  '有指标意识，但评估体系还停留在「上线后看结果」的层面。对离线评测集、在线 A/B、以及幻觉率/召回率等 AI 专属指标的选用边界不够清晰。',
  '更习惯从「技术能做什么」出发，而不是「用户卡在哪」。用户访谈与场景挖掘做得少，需求常缺少真实用户验证，容易拍脑袋定方向。',
  '对定价与商业模式有基本概念，但缺少「先验证付费意愿再规模化」的框架。对获客成本、token 成本、留存构成的单位经济模型拆解偏弱。',
  '与工程师沟通顺畅，迭代节奏把握到位。但对技术债与延迟上线风险的预判不足，需求评审时容易被技术细节带着走。',
]

export const mockResult: ResultItem[] = dimensions.map((d, i) => ({
  name: d.name,
  color: d.color,
  score: scores[i],
  diagnosis: diagnoses[i],
}))

// 模拟总分（综合能力，非六项算术平均）
export const totalScore = 72
export const totalLevel = '中级水平'

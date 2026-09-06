import { dimensions } from './dimensions'
import { replayCat } from '../lib/cat'
import type { SessionAnswer } from '../lib/session'

export interface ResultItem {
  id: number
  name: string
  color: string
  score: number
  diagnosis: string
}

// 诊断文案仍为 mock（按维度 id 1–6 对齐），之后替换为真实诊断
const DIAGNOSES: Record<number, string> = {
  1: '大模型选型和能力边界的判断扎实，能分清 RAG 与微调的适用场景。但多模态与成本优化的量化分析偏弱，复杂选型时容易凭经验而非数据下判断。',
  2: '需求拆解和 PRD 基本功扎实，能把模糊需求落成清晰的用户故事。但对 AI 输出不确定性的设计预案不足，异常兜底、加载态与置信度提示考虑得不够系统。',
  3: '有指标意识，但评估体系还停留在「上线后看结果」的层面。对离线评测集、在线 A/B、以及幻觉率/召回率等 AI 专属指标的选用边界不够清晰。',
  4: '更习惯从「技术能做什么」出发，而不是「用户卡在哪」。用户访谈与场景挖掘做得少，需求常缺少真实用户验证，容易拍脑袋定方向。',
  5: '对定价与商业模式有基本概念，但缺少「先验证付费意愿再规模化」的框架。对获客成本、token 成本、留存构成的单位经济模型拆解偏弱。',
  6: '与工程师沟通顺畅，迭代节奏把握到位。但对技术债与延迟上线风险的预判不足，需求评审时容易被技术细节带着走。',
}

/** 回放 CAT 状态，取各维度能力分转成 0–100 分（初始 50，无作答保持 50） */
export function computeResult(
  ids: number[],
  answers: Record<number, SessionAnswer>,
): ResultItem[] {
  const state = replayCat(ids, answers)
  return dimensions.map((d) => ({
    id: d.id,
    name: d.name,
    color: d.color,
    score: Math.round(state.score[d.id]),
    diagnosis: DIAGNOSES[d.id] ?? '',
  }))
}

/** 综合分 = 六维 score 的简单均值（四舍五入） */
export function computeTotalScore(results: ResultItem[]): number {
  if (results.length === 0) return 0
  return Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
}

export function levelOf(score: number): string {
  if (score >= 85) return '高级水平'
  if (score >= 70) return '中高级水平'
  if (score >= 55) return '中级水平'
  return '初级水平'
}

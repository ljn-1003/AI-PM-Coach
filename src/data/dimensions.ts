export interface Dimension {
  id: number
  name: string
  desc: string
  /** 维度专属低饱和色（蓝/青/绿/橙/紫/粉），用于介绍页徽标、答题页标签、雷达图与结果列表 */
  color: string
}

/** 测评的 6 个能力维度 —— 介绍页、答题页、结果页共用的单一数据源 */
export const dimensions: Dimension[] = [
  { id: 1, name: 'AI 技术理解', desc: '大模型能力边界、Prompt、RAG、微调等基础认知', color: '#5b7fa6' },
  { id: 2, name: '产品设计', desc: '需求分析、PRD、原型与交互设计', color: '#5f9ba0' },
  { id: 3, name: '数据与评估', desc: '指标设计、评测体系、A/B 实验', color: '#6f9c78' },
  { id: 4, name: '用户洞察', desc: '用户研究、场景挖掘、需求验证', color: '#c2895c' },
  { id: 5, name: '商业化思维', desc: '商业模式、定价、GTM 策略', color: '#8c7aa6' },
  { id: 6, name: '工程协作与落地', desc: '与工程师协作、敏捷流程、交付落地', color: '#bb85a0' },
]

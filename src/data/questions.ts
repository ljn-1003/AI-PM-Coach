export interface QuizQuestion {
  /** 所属维度名，对应 dimensions.ts 里的 name */
  category: string
  stem: string
  /** 固定 4 个选项 */
  options: string[]
  /** 正确答案下标（本页不展示，供后续评分/结果页使用） */
  correctIndex: number
}

/** 测评题库 —— 目前是 5 道样题，最终扩展到 15 题 */
export const questions: QuizQuestion[] = [
  {
    category: 'AI 技术理解',
    stem: '在为客服场景设计 AI 助手时，处理多轮对话上下文，最合适的方案是？',
    options: [
      '每次请求都携带全部历史对话原文',
      '对历史对话做摘要，并结合向量检索召回相关片段',
      '只传当前这一轮的用户消息，忽略历史',
      '使用固定 prompt 模板，不传任何上下文',
    ],
    correctIndex: 1,
  },
  {
    category: '产品设计',
    stem: '设计一个 AI 简历优化产品，用户输入岗位 JD 后获得修改建议，最核心的产品闭环是？',
    options: [
      '输入 → 一次性生成建议 → 结束',
      '输入 → 生成 → 直接跳转模板库',
      '输入 → 生成 → 用户可编辑/反馈 → 基于反馈再生成',
      '输入 → 强制付费 → 查看结果',
    ],
    correctIndex: 2,
  },
  {
    category: '数据与评估',
    stem: '新版 AI 写作助手上线后，判断它是否比旧版更好，最可靠的评估方式是？',
    options: [
      '建立固定评测集，对比新旧版在指标与人工抽检上的表现',
      '只看注册用户数是否增长',
      '看底层模型参数规模是否更大',
      '让内部团队试用后投票',
    ],
    correctIndex: 0,
  },
  {
    category: '用户洞察',
    stem: '用户普遍反馈 AI 总结「抓不住重点」，作为产品经理，下一步最该做的是？',
    options: [
      '让工程师调高模型 temperature 参数',
      '分析真实对话样本，定位具体失败场景后再优化',
      '先上线更多功能转移注意力',
      '发问卷问用户「你觉得哪里不好」',
    ],
    correctIndex: 1,
  },
  {
    category: '商业化思维',
    stem: '为一个 AI 会议纪要工具设计起步定价，最合理的策略是？',
    options: [
      '直接对标大厂定高价',
      '永久免费，靠广告变现',
      '只提供一次性买断',
      '免费额度 + 按用量分层订阅，先验证付费意愿',
    ],
    correctIndex: 3,
  },
]

/** 完整测评总题数（进度条展示用）；当前题库只实现 5 道样题 */
export const TOTAL_QUESTIONS = 15

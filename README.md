# AI PM Coach

给想转 AI 产品经理的人做能力诊断的测评工具：用 15 道自适应题目测出 6 个能力维度的短板，结合 LLM 生成个性化诊断与学习建议.

<img width="449" height="787" alt="屏幕截图 2026-09-12 164919" src="https://github.com/user-attachments/assets/ff365c5e-cf20-47e7-b332-55fcafbdfb04" />
<img width="452" height="783" alt="屏幕截图 2026-09-12 164858" src="https://github.com/user-attachments/assets/fb73f479-57fb-4d40-a97f-6070bfad33f9" />
<img width="449" height="787" alt="image" src="https://github.com/user-attachments/assets/6e833cab-97ed-4c41-9a71-68f6ef240138" />

## 目录

- [功能](#功能)![Uploading 屏幕截图 2026-09-12 163911.png…]()

- [快速开始](#快速开始)
- [环境变量](#环境变量)
- [存储/工作目录说明](#存储工作目录说明)
- [项目结构](#项目结构)
- [技术栈](#技术栈)
- [注意事项](#注意事项)

## 功能

### 核心

- **CAT 自适应测评**：固定 15 题（6 个维度各 2 题 + 随机 3 个维度各 1 题），题目难度随答题情况动态升降——答对升难度、答错降难度；能力分按「旧分 × 0.7 + 本题贡献 × 0.3」滑动更新。
- **6 维能力雷达图**：`AI 技术理解` / `产品设计` / `数据与评估` / `用户洞察` / `商业化思维` / `工程协作与落地`，每维输出 0–100 能力分与定性分级（初级/中级/中高级/高级）。
- **AI 个性化诊断**：调用 Deepseek 按维度生成总结、薄弱点（证据/原因/建议）与鼓励，强制引用具体题号；调用失败自动重试（1s / 3s），仍失败则降级为本地预置文本。
- **学习资源推荐**：针对弱项维度推荐 3–5 个学习资源，AI 只给搜索关键词、不给 URL；无 API Key 时回退到内置兜底资源列表。
- **成长追踪**：每次测评保存能力快照（答满 10 题才记录）；完成 2 次以上测评后，成长页才显示复测对比（总分变化、提升最大维度、仍需加强的弱项）与成长折线图（需手动展开）。

### 扩展工具

- **断点续答**：答题进度写入 `localStorage`，刷新或关闭后可从中断处继续，也可放弃重来。
- **题库自动生成**：`npm run build:questions` 从 Markdown 题库解析生成 `src/data/questionBank.ts`。
- **结果页交互**：分数构成弹窗（点雷达图顶点）、诊断卡片折叠展开与重新生成、错题回顾（仅复测总分较上次下降 5 分以上时出现）。

## 快速开始

```bash
# 1. 克隆仓库
git clone <仓库地址>
cd ai-pm-coach

# 2. 安装依赖
npm install

# 3. 配置环境变量（可选，见「环境变量」章节；缺省时诊断走本地降级）
cp .env.example .env   # 复制后填入 VITE_LLM_API_KEY

# 4. 启动开发服务器
npm run dev
```

启动后访问 <http://localhost:5173>。

其他命令：

```bash
npm run build            # 类型检查 + 构建到 dist/
npm run preview          # 预览构建产物
npm run lint             # oxlint 代码检查
npm run build:questions  # 从 Markdown 题库重新生成 src/data/questionBank.ts
```

## 运行配置

暂无特殊运行配置，按[快速开始](#快速开始)启动即可。

## 环境变量

| 变量 | 是否必需 | 说明                                                           |
|---|---|--------------------------------------------------------------|
| `VITE_LLM_API_KEY` | 否 | Deepseek API Key，用于 AI 诊断与学习资源推荐。缺省时诊断降级为本地预置文本、资源回退到内置兜底列表。 |



## 存储/工作目录说明

### 浏览器本地存储（`localStorage`）

| Key | 内容 |
|---|---|
| `ai-pm-coach:session` | 当前答题会话：本轮维度序列、已抽题号、作答记录、开始时间 |
| `ai-pm-coach:history` | 累积答题历史（跨测评），复测抽题时用于避开已答过的题 |
| `ai-pm-coach:snapshots` | 能力快照（每次测评的六维得分 + 总分），供复测对比与成长曲线 |

### 生成文件

| 路径 | 来源 | 说明 |
|---|---|---|
| `src/data/questionBank.ts` | `npm run build:questions` | 由根目录 Markdown 题库解析生成，**勿手改** |

## 项目结构

```
.
├── src/
│   ├── main.tsx            # 入口：挂载 RouterProvider + StrictMode
│   ├── App.tsx             # 路由表（仅定义路由，不写页面逻辑）
│   ├── index.css           # Tailwind 引入 + @theme 设计 token
│   ├── components/         # 可复用 UI 组件（无业务逻辑）
│   │   ├── Button.tsx      # 通用按钮（支持按钮 / 路由链接两种形态）
│   │   ├── RadarChart.tsx  # 六维雷达图（支持单图与复测对比）
│   │   ├── DiagnosisCard.tsx # 单维度诊断卡片
│   │   ├── GrowthChart.tsx # 成长折线图（多维度）
│   │   └── ScoreModal.tsx  # 分数构成解释弹窗
│   ├── data/               # 单一数据源（页面只读不写）
│   │   ├── dimensions.ts   # 6 个维度定义 + 专属低饱和色
│   │   ├── questionBank.ts # 题库（自动生成）
│   │   └── result.ts       # 结果计算：能力分、总分、水平分级
│   ├── lib/                # 纯逻辑（无渲染）
│   │   ├── cat.ts          # CAT 自适应：抽题、计分、难度升降
│   │   ├── session.ts      # localStorage 读写封装
│   │   └── diagnose.ts     # llm 诊断 + 学习资源推荐
│   └── pages/              # 路由页面
│       ├── Landing.tsx     # 落地页（老用户直接进 Dashboard）
│       ├── Intro.tsx       # 测评介绍页（6 维 + 时长说明）
│       ├── Quiz.tsx        # 答题页（CAT 抽题 + 断点续答）
│       ├── Result.tsx      # 结果页（雷达图 + 诊断 + 复测反馈）
│       └── Dashboard.tsx   # 成长页（快照对比 + 成长曲线）
├── scripts/
│   ├── build-question-bank.mjs   # 题库生成脚本
│   └── prepare-reannotation.mjs  # 题库标注预处理
├── AI产品经理面试题库_标注版_含考察点.md  # 题库 Markdown 源（脚本输入）
├── vite.config.ts
└── package.json
```

## 技术栈



- [react-router-dom v7]
- [Deepseek API]
- [oxlint]




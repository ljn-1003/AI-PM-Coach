# AI PM Coach

给想转 AI 产品经理的人做能力诊断：从 6 个维度测出你的能力短板，并给出针对性诊断。

## 技术栈

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- react-router-dom v7

## 快速开始

```bash
npm install
npm run dev      # 本地开发，访问 http://localhost:5173
npm run build    # 类型检查 + 构建到 dist/
npm run preview  # 预览构建产物
npm run lint     # oxlint 代码检查
```

## 页面

| 路由 | 页面 | 说明 |
|---|---|---|
| `/` | 落地页 | 首屏 + 开始测评入口 |
| `/intro` | 测评介绍 | 6 个维度 + 时长说明 |
| `/quiz` | 答题页 | 单选 + 跳过，不判对错 |
| `/result` | 结果页 | 雷达图 + 六维度诊断 |

## 目录结构

```
src/
├── main.tsx / App.tsx    # 入口 + 路由
├── index.css             # Tailwind 主题 token（暖白底 + 深蓝主色）
├── data/                 # 单一数据源：维度、题库、mock 结果
├── components/           # 可复用组件：Button、RadarChart
└── pages/                # 路由页面：Landing / Intro / Quiz / Result
```

## 当前状态

- 题库目前 5 道样题，目标 15 题（进度条已按 15 题展示）
- 结果页使用 mock 数据，尚未接入真实评分
- 暂无后端 / 用户系统 / API 调用

## 项目约定

结构约定、设计 token、命令见 [CLAUDE.md](./CLAUDE.md)。

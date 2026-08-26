# AI PM Coach

给想转 AI 产品经理的人做能力诊断。本版只含落地页、测评介绍页、空白答题页。

## 技术栈

- React 19 + TypeScript + Vite
- Tailwind CSS v4（`@tailwindcss/vite` 插件，CSS-first 配置，无 `tailwind.config.js`）
- react-router-dom v7

## 命令

```bash
npm run dev      # 本地开发
npm run build    # 类型检查 + 构建
npm run lint     # oxlint
npm run preview  # 预览构建产物
```

## 目录结构约定

```
src/
├── main.tsx            # 入口，挂 RouterProvider
├── App.tsx             # 路由表（仅定义路由，不写页面逻辑）
├── index.css           # Tailwind 引入 + @theme 设计 token
├── data/               # 单一数据源（维度、题目等，页面只读不写）
├── components/         # 可复用 UI 组件（无业务逻辑）
└── pages/              # 路由页面
```

- 新页面放 `src/pages/`，在 `App.tsx` 注册路由。
- 跨页面共享的数据（如 6 个维度）放 `src/data/`，避免多处硬编码。
- 通用按钮/卡片等放 `src/components/`。

## 设计 token（见 `src/index.css` 的 `@theme`）

| token | 值 | 用途 |
|---|---|---|
| `canvas` | `#faf9f7` | 暖白背景 |
| `card` | `#fffefb` | 题目卡片背景 |
| `primary` | `#1e3a5f` | 深蓝主色（按钮、强调） |
| `primary-hover` | `#16304f` | 主色 hover |
| `ink` | `#1f2328` | 正文 |
| `muted` | `#6b7280` | 次要文字 |
| `line` | `#e8e6e1` | 边框/分隔 |
| `strong` | `#4f8a5f` | 强项绿（低饱和） |
| `weak` | `#c08a4f` | 弱项橙（低饱和，不用红） |

直接用 Tailwind 工具类引用：`bg-canvas` / `bg-primary` / `text-ink` / `text-muted` / `border-line` / `text-strong` / `text-weak`。

## 字体与配色约定

- **正文无衬线**（`--font-sans`），**标题宋体**（`--font-serif`，书卷感），已在 `@layer base` 里让 `h1–h6` 自动用宋体。
- **6 个维度的专属低饱和色**存在 `src/data/dimensions.ts` 的 `color` 字段（不是 CSS token），介绍页徽标和未来雷达图共用这一份数据源。
- 圆角/阴影克制：卡片用 `rounded-lg` + `border-line` 描边，不加阴影。

风格：Notion 式简约、专业感；暖白背景 + 深蓝主色，不鲜艳。

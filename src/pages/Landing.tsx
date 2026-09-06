import { Button } from '../components/Button'
import { loadSnapshots } from '../lib/session'
import Dashboard from './Dashboard'

export default function Landing() {
  const hasSnapshots = loadSnapshots().length > 0

  // 老用户（有历史快照）打开首页直接进能力主页：雷达图 + 复测对比 + 立即复测
  if (hasSnapshots) {
    return <Dashboard />
  }

  return (
    <main className="flex min-h-screen flex-col px-6">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
          测出你的 AI PM 能力短板
        </h1>
        <p className="mt-5 text-base text-muted sm:text-lg">
          15 分钟，6 个维度，告诉你该补什么
        </p>
        <div className="mt-10 flex w-full max-w-xs flex-col gap-3">
          <Button to="/intro" className="w-full">
            开始测评
          </Button>
        </div>
      </div>

      <footer className="pb-8 text-center text-sm text-muted">
        已有 1234 人完成测评
      </footer>
    </main>
  )
}

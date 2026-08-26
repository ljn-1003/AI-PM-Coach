import { Button } from '../components/Button'
import { RadarChart } from '../components/RadarChart'
import { mockResult, totalLevel, totalScore } from '../data/result'

export default function Result() {
  const radarData = mockResult.map((r) => ({ label: r.name, value: r.score, color: r.color }))

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-12">
      {/* 顶部：总分 + 定性评价 */}
      <header className="text-center">
        <p className="text-sm text-muted">你的 AI PM 综合能力</p>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight text-ink">
          {totalScore}分
          <span className="ml-3 text-2xl font-medium text-muted">· {totalLevel}</span>
        </h1>
      </header>

      {/* 中间：雷达图 + 维度列表 */}
      <div className="mt-12 grid items-center gap-10 md:grid-cols-[1.25fr_0.75fr]">
        <RadarChart data={radarData} />
        <ul className="flex flex-col gap-6">
          {mockResult.map((r) => (
            <li key={r.name} className="flex items-start gap-3">
              <span
                className="mt-1.5 h-3.5 w-3.5 shrink-0 rounded"
                style={{ backgroundColor: r.color }}
              />
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-ink">{r.name}</span>
                  <span className="text-sm font-semibold" style={{ color: r.color }}>
                    {r.score}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-muted">{r.diagnosis}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* 底部：学习计划按钮（暂不跳转） */}
      <div className="mt-14 flex justify-center">
        <Button className="w-full max-w-xs">开始你的学习计划</Button>
      </div>
    </main>
  )
}

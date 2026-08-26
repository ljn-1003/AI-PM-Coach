import { Button } from '../components/Button'
import { dimensions } from '../data/dimensions'

export default function Intro() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6 py-16">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          测评介绍
        </h1>
        <p className="mt-3 text-base text-muted">
          我们从 6 个维度评估你的 AI PM 能力，帮你定位最该补的短板。
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-1.5 text-sm text-muted">
          <span aria-hidden>⏱</span> 约 15 分钟 · 6 个维度
        </div>
      </header>

      <ul className="mt-10 flex flex-col gap-3">
        {dimensions.map((d) => (
          <li
            key={d.id}
            className="flex items-start gap-4 rounded-lg border border-line bg-white p-4"
          >
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sm font-medium"
              style={{ backgroundColor: `${d.color}1a`, color: d.color }}
            >
              {d.id}
            </span>
            <div>
              <h2 className="font-medium text-ink">{d.name}</h2>
              <p className="mt-1 text-sm text-muted">{d.desc}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-12 flex flex-col items-center gap-4">
        <Button to="/quiz" className="w-full max-w-xs">
          开始
        </Button>
      </div>
    </main>
  )
}

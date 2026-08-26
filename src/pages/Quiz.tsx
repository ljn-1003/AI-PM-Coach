import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { dimensions } from '../data/dimensions'
import { questions, TOTAL_QUESTIONS } from '../data/questions'

export default function Quiz() {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const navigate = useNavigate()

  const total = TOTAL_QUESTIONS
  const question = questions[index]
  const isLast = index === questions.length - 1
  const categoryColor = dimensions.find((d) => d.name === question.category)?.color ?? '#6b7280'

  const goNext = () => {
    if (isLast) {
      navigate('/result')
      return
    }
    setIndex(index + 1)
    setSelected(null)
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-6 py-10">
      {/* 进度条 */}
      <div>
        <p className="text-sm text-muted">
          第 {index + 1} 题 / 共 {total} 题
        </p>
        <div className="mt-2 h-1.5 w-full rounded-full bg-line">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* 题目卡片 */}
      <div className="mt-8 rounded-lg bg-card p-6 sm:p-8">
        {/* 顶部小字：题号 + 维度 */}
        <p className="text-sm">
          <span className="font-medium text-muted">#{index + 1}</span>
          <span className="mx-0.5 text-muted">・</span>
          <span className="font-medium" style={{ color: categoryColor }}>
            {question.category}
          </span>
        </p>

        {/* 题干：18–20px，行高 1.6，左对齐 */}
        <p className="mt-3 text-lg leading-[1.6] text-ink sm:text-xl">
          {question.stem}
        </p>

        {/* 选项 */}
        <div className="mt-6 flex flex-col gap-3">
          {question.options.map((option, i) => {
            const isSelected = selected === i
            return (
              <button
                key={i}
                type="button"
                onClick={() => setSelected(i)}
                className={`flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-line bg-white hover:border-primary'
                }`}
              >
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-sm font-medium transition-colors ${
                    isSelected ? 'bg-primary text-white' : 'border border-line text-muted'
                  }`}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-base leading-relaxed text-ink">{option}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 底部操作 */}
      <div className="mt-10 flex items-center gap-4">
        <Button onClick={goNext} disabled={selected === null} className="flex-1">
          {isLast ? '完成' : '下一题'}
        </Button>
        <button
          type="button"
          onClick={goNext}
          className="shrink-0 text-sm text-muted hover:text-ink"
        >
          跳过本题
        </button>
      </div>
    </main>
  )
}

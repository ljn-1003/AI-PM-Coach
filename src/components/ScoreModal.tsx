interface Props {
  name: string
  color: string
  score: number
  answered: number
  highDifficulty: number
  correct: number
  wrong: number
  onClose: () => void
  onRetake: () => void
}

export function ScoreModal({
  name,
  color,
  score,
  answered,
  highDifficulty,
  correct,
  wrong,
  onClose,
  onRetake,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-card p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-baseline justify-between">
          <span className="font-semibold text-ink">{name}</span>
          <button type="button" onClick={onClose} className="text-sm text-muted hover:text-ink">
            关闭
          </button>
        </div>

        <p className="mt-3 text-4xl font-bold" style={{ color }}>
          {score}分
        </p>

        <dl className="mt-5 flex flex-col gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">作答情况</dt>
            <dd className="text-right text-ink">
              答了 {answered} 道（其中 {highDifficulty} 道高难度）
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">对错</dt>
            <dd className="text-right text-ink">
              答对 {correct} 道，答错 {wrong} 道
            </dd>
          </div>
        </dl>

        <div className="mt-4 rounded bg-line/50 px-3 py-2 text-xs text-muted">
          分数计算：初始 50，每题 新分 = 旧分 × 0.7 + 本题贡献 × 0.3（答对高分题贡献高，答错低分题贡献低）
        </div>

        <button
          type="button"
          onClick={onRetake}
          className="mt-5 w-full rounded-lg bg-primary py-3 text-sm font-medium text-white hover:bg-primary-hover"
        >
          重测这个维度
        </button>
      </div>
    </div>
  )
}

import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface ButtonProps {
  /** 传入则渲染为跳转链接（react-router Link） */
  to?: string
  /** 传入则渲染为按钮并绑定点击 */
  onClick?: () => void
  disabled?: boolean
  children: ReactNode
  className?: string
}

const base =
  'inline-flex items-center justify-center rounded-lg bg-primary px-8 py-4 text-base font-medium text-white transition-colors enabled:hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50'

export function Button({ to, onClick, disabled = false, children, className = '' }: ButtonProps) {
  if (to) {
    return (
      <Link to={to} className={`${base} ${className}`}>
        {children}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${base} ${className}`}>
      {children}
    </button>
  )
}

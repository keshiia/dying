import { clsx } from 'clsx'
import type { InputHTMLAttributes } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement>

export default function Input({ className, ...props }: Props) {
  return (
    <input
      className={clsx(
        'h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-[var(--p-accent)] focus:ring-2 focus:ring-[color:var(--p-accent)]/20',
        className,
      )}
      {...props}
    />
  )
}


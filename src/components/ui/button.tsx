import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'danger'

type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  variant?: ButtonVariant
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'rounded-xl bg-[var(--color-brand)] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-strong)]',
  secondary: 'rounded-xl border border-[var(--color-border-strong)] bg-white px-5 py-2 text-sm text-[var(--color-ink-soft)] transition hover:text-[var(--color-ink)]',
  danger: 'rounded-xl border border-red-300 bg-red-50 px-5 py-2 text-sm text-red-700 transition hover:bg-red-100',
}

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  return <button className={cn(variantStyles[variant], className)} {...props} />
}

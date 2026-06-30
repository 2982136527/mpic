'use client'

const platforms = [
  {
    id: 'twitter',
    label: 'X (Twitter)',
    href: (u: string, t: string) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}&url=${encodeURIComponent(u)}`,
    svg: (
      <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
        <path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z'/>
      </svg>
    ),
  },
  {
    id: 'reddit',
    label: 'Reddit',
    href: (u: string, t: string) =>
      `https://reddit.com/submit?url=${encodeURIComponent(u)}&title=${encodeURIComponent(t)}`,
    svg: (
      <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
        <path d='M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.21.677-.334 1.074-.334a1.79 1.79 0 0 1 0 3.578c-.584 0-1.109-.28-1.444-.7-1.574 1.04-3.787 1.682-6.293 1.682s-4.719-.642-6.293-1.682a1.783 1.783 0 0 1-1.444.7 1.79 1.79 0 0 1 0-3.578c.397 0 .766.124 1.074.334 1.194-.856 2.85-1.418 4.674-1.488l-.8-3.747a.37.37 0 0 1 .308-.38l3.133-.665a.37.37 0 0 1 .438.264l.862 3.377c.778-.058 1.565-.09 2.357-.09.34 0 .677.006 1.012.017l.862-3.377a.37.37 0 0 1 .439-.265l3.132.666a.37.37 0 0 1 .308.38l-.022.003zm-6.853 6.763a1.07 1.07 0 0 0-1.07 1.07 1.07 1.07 0 0 0 1.07 1.07 1.07 1.07 0 0 0 1.07-1.07 1.07 1.07 0 0 0-1.07-1.07zm3.686 0a1.07 1.07 0 0 0-1.07 1.07 1.07 1.07 0 0 0 1.07 1.07 1.07 1.07 0 0 0 1.07-1.07 1.07 1.07 0 0 0-1.07-1.07zm-3.684 2.64a.29.29 0 0 0-.25.45c.493.747 1.395 1.243 2.633 1.243 1.239 0 2.14-.496 2.633-1.243a.29.29 0 0 0-.25-.45.29.29 0 0 0-.25.14c-.418.635-1.194 1.053-2.133 1.053s-1.715-.418-2.134-1.053a.29.29 0 0 0-.25-.14z'/>
      </svg>
    ),
  },
  {
    id: 'telegram',
    label: 'Telegram',
    href: (u: string, t: string) =>
      `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}`,
    svg: (
      <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
        <path d='M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z'/>
      </svg>
    ),
  },
  {
    id: 'facebook',
    label: 'Facebook',
    href: (u: string, _t: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}`,
    svg: (
      <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
        <path d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z'/>
      </svg>
    ),
  },
]

type Props = {
  url: string
  title: string
}

export function SocialShare({ url, title }: Props) {
  return (
    <div className='flex items-center gap-1.5'>
      {platforms.map(p => (
        <a
          key={p.id}
          href={p.href(url, title)}
          target='_blank'
          rel='noopener noreferrer'
          onClick={e => {
            e.preventDefault()
            window.open(p.href(url, title), p.label, 'width=600,height=400')
          }}
          aria-label={`Share on ${p.label}`}
          className='flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-ink-soft)] transition hover:bg-[var(--color-border-strong)]/30 hover:text-[var(--color-ink)]'
        >
          {p.svg}
        </a>
      ))}
    </div>
  )
}

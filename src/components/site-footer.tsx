export function SiteFooter() {
  return (
    <footer className='mx-auto w-full max-w-6xl px-5 pb-8 pt-12 sm:px-8'>
      <div className='text-center text-xs text-[var(--color-ink-soft)]'>
        <p>
          Mpic &mdash; 基于 GitHub 存储的公开图床{' '}
          <a href='https://github.com/2982136527/mpic' target='_blank' rel='noopener noreferrer' className='underline transition hover:text-[var(--color-brand)]'>
            GitHub
          </a>
        </p>
      </div>
    </footer>
  )
}

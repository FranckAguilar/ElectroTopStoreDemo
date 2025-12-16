type Props = {
  currentPage: number
  lastPage: number
  onPageChange: (page: number) => void
}

type PageToken = number | 'ellipsis'

function buildPageTokens(currentPage: number, lastPage: number): PageToken[] {
  const delta = 2
  const left = Math.max(1, currentPage - delta)
  const right = Math.min(lastPage, currentPage + delta)

  const tokens: PageToken[] = []

  if (left > 1) {
    tokens.push(1)
    if (left > 2) tokens.push('ellipsis')
  }

  for (let page = left; page <= right; page += 1) tokens.push(page)

  if (right < lastPage) {
    if (right < lastPage - 1) tokens.push('ellipsis')
    tokens.push(lastPage)
  }

  return tokens
}

export function Pagination({ currentPage, lastPage, onPageChange }: Props) {
  if (lastPage <= 1) return null

  const canPrev = currentPage > 1
  const canNext = currentPage < lastPage
  const tokens = buildPageTokens(currentPage, lastPage)

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
      <button
        className="rounded-lg border px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        disabled={!canPrev}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Anterior
      </button>

      <div className="flex items-center gap-1">
        {tokens.map((token, index) => {
          if (token === 'ellipsis') {
            return (
              <span key={`e-${index}`} className="px-2 text-sm text-slate-400">
                …
              </span>
            )
          }

          const active = token === currentPage
          return (
            <button
              key={token}
              className={[
                'min-w-9 rounded-lg border px-3 py-2 text-sm font-semibold transition',
                active ? 'border-brand-600 bg-brand-600 text-white' : 'text-slate-700 hover:bg-slate-50',
              ].join(' ')}
              onClick={() => onPageChange(token)}
              aria-current={active ? 'page' : undefined}
            >
              {token}
            </button>
          )
        })}
      </div>

      <button
        className="rounded-lg border px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        disabled={!canNext}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Siguiente
      </button>

      <div className="w-full text-center text-xs text-slate-500">{`P\u00e1gina ${currentPage} de ${lastPage}`}</div>
    </div>
  )
}


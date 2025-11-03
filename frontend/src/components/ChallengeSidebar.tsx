import clsx from 'clsx'

import type { ChallengeSummary } from '../types'

type Props = {
  challenges: ChallengeSummary[]
  selectedSlug: string | null
  onSelect: (slug: string) => void
  isLoading?: boolean
}

export function ChallengeSidebar({ challenges, selectedSlug, onSelect, isLoading }: Props) {
  return (
    <aside className="rounded-xl bg-surface.panel p-4 shadow-panel">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Challenges
        </h2>
        {isLoading && <span className="text-xs text-slate-500">Loading…</span>}
      </div>
      <ul className="space-y-2">
        {challenges.map((challenge) => (
          <li key={challenge.slug}>
            <button
              type="button"
              onClick={() => onSelect(challenge.slug)}
              className={clsx(
                'w-full rounded-lg border border-transparent px-4 py-3 text-left transition',
                'bg-slate-900/60 hover:border-brand.light',
                selectedSlug === challenge.slug &&
                  'border-brand.light bg-brand.primary/10 text-brand.light shadow-panel'
              )}
            >
              <p className="text-sm font-semibold text-slate-100">{challenge.title}</p>
              <p className="mt-1 text-xs text-slate-400">
                {challenge.category} · {challenge.language.toUpperCase()}
              </p>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  )
}

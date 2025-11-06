import type { ChallengeSummary } from '../types'

type Props = {
  challenges: ChallengeSummary[]
  selectedSlug: string | null
  onSelect: (slug: string) => void
  isLoading?: boolean
}

export function ChallengeSidebar({ challenges, selectedSlug, onSelect, isLoading }: Props) {
  const hasChallenges = challenges.length > 0

  return (
    <aside className="panel sidebar">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Challenge Catalog</p>
          <h2 className="panel__title">Choose a scenario</h2>
        </div>
        {isLoading && <span className="muted">Loading…</span>}
      </div>

      {hasChallenges ? (
        <ul className="sidebar__list">
          {challenges.map((challenge) => {
            const isActive = challenge.slug === selectedSlug
            return (
              <li key={challenge.slug}>
                <button
                  type="button"
                  className={`sidebar__item${isActive ? ' sidebar__item--active' : ''}`}
                  onClick={() => onSelect(challenge.slug)}
                >
                  <span className="sidebar__item-title">{challenge.title}</span>
                  <span className="sidebar__item-meta">
                    {challenge.category} · {challenge.language.toUpperCase()}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="empty-state">
          <p className="muted">
            {isLoading ? 'Fetching challenge catalog…' : 'No challenges available yet.'}
          </p>
        </div>
      )}
    </aside>
  )
}

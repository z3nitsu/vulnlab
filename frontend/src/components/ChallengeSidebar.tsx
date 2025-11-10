import type { ChallengeSummary } from '../types'

type Props = {
  challenges: ChallengeSummary[]
  selectedSlug: string | null
  onSelect: (slug: string) => void
  isLoading?: boolean
  className?: string
  onClose?: () => void
}

export function ChallengeSidebar({
  challenges,
  selectedSlug,
  onSelect,
  isLoading,
  className,
  onClose,
}: Props) {
  const hasChallenges = challenges.length > 0
  const containerClassName = ['panel sidebar', className].filter(Boolean).join(' ')

  return (
    <aside className={containerClassName}>
      <div className="panel__header">
        <div>
          <p className="eyebrow">Challenge Catalog</p>
          <h2 className="panel__title">Choose a scenario</h2>
        </div>
        <div className="sidebar__header-actions">
          {isLoading && <span className="muted small">Loading…</span>}
          {onClose ? (
            <button
              type="button"
              className="ghost-button ghost-button--icon"
              onClick={onClose}
              aria-label="Close catalog"
            >
              ✕
            </button>
          ) : null}
        </div>
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

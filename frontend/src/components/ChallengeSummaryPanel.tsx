import { useMemo } from 'react'
import type { ChallengeDetail } from '../types'

type Props = {
  challenge: ChallengeDetail | null
  isLoading?: boolean
}

export function ChallengeSummaryPanel({ challenge, isLoading }: Props) {
  const snippetLines = useMemo(() => {
    if (!challenge) return []
    return challenge.vulnerable_snippet.split('\n')
  }, [challenge])

  if (isLoading) {
    return (
      <section className="panel">
        <div className="skeleton-group">
          <div className="skeleton skeleton--title" />
          <div className="skeleton skeleton--body" />
          <div className="skeleton skeleton--body" />
          <div className="skeleton skeleton--code" />
        </div>
      </section>
    )
  }

  if (!challenge) {
    return (
      <section className="panel">
        <div className="empty-state">
          <h2 className="panel__title">Select a challenge</h2>
          <p className="muted">Browse the catalog to inspect the vulnerable snippet and acceptance criteria.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="panel">
      <div className="panel__header panel__header--stacked">
        <p className="eyebrow">{challenge.category}</p>
        <h2 className="panel__title">{challenge.title}</h2>
        <span className="muted">{challenge.language.toUpperCase()}</span>
      </div>

      <p className="body-text">{challenge.description}</p>

      <div className="code-block">
        {snippetLines.map((line, index) => (
          <div key={index} className="code-block__line">
            <span className="code-block__line-number">{index + 1}</span>
            <span className="code-block__content">{line || '\u00A0'}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

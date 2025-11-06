import { useMemo } from 'react'

import type { ChallengeDetail } from '../types'
import { Tabs } from './ui/Tabs'

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

  const overviewTab = {
    id: 'overview',
    label: 'Overview',
    content: (
      <div className="challenge-overview">
        <p className="body-text body-text--muted">{challenge.description}</p>
        <div className="code-block">
          {snippetLines.map((line, index) => (
            <div key={index} className="code-block__line">
              <span className="code-block__line-number">{index + 1}</span>
              <span className="code-block__content">{line || '\u00A0'}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  }

  const criteriaTab = {
    id: 'criteria',
    label: `Acceptance Criteria (${challenge.acceptance_criteria?.length ?? 0})`,
    content: (
      <ul className="list list--dense">
        {(challenge.acceptance_criteria ?? []).map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    ),
  }

  const hintsTab = {
    id: 'hints',
    label: `Hints (${challenge.hints?.length ?? 0})`,
    content: challenge.hints?.length ? (
      <ul className="list list--dense">
        {challenge.hints.map((hint, index) => (
          <li key={index}>{hint}</li>
        ))}
      </ul>
    ) : (
      <p className="muted small">No hints provided for this challenge yet.</p>
    ),
  }

  const tabs = [overviewTab, criteriaTab, hintsTab]

  return (
    <section className="panel">
      <div className="panel__header panel__header--stacked">
        <p className="eyebrow">{challenge.category}</p>
        <h2 className="panel__title">{challenge.title}</h2>
        <span className="muted language-pill">{challenge.language.toUpperCase()}</span>
      </div>

      <Tabs tabs={tabs} />
    </section>
  )
}

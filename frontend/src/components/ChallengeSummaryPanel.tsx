import { useMemo } from 'react'

import type { ChallengeDetail } from '../types'

type Props = {
  challenge: ChallengeDetail | null
}

export function ChallengeSummaryPanel({ challenge }: Props) {
  const lines = useMemo(() => {
    if (!challenge) return []
    return challenge.vulnerable_snippet.split('\n')
  }, [challenge])

  if (!challenge) {
    return (
      <div className="rounded-xl bg-surface.panel p-6 text-center text-sm text-slate-400 shadow-panel">
        Select a challenge to view the vulnerable snippet.
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-surface.panel p-4 shadow-panel">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">{challenge.title}</h1>
          <p className="text-sm text-slate-400">
            {challenge.category} · {challenge.language.toUpperCase()}
          </p>
        </div>
      </div>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-300">
        <p>{challenge.description}</p>
        <div className="overflow-hidden rounded-lg border border-slate-800">
          <pre className="bg-slate-950/80 p-4 text-xs leading-6 text-slate-200">
            {lines.map((line, idx) => (
              <span className="block" key={idx}>
                <span className="select-none pr-4 text-slate-600">{idx + 1}</span>
                {line}
              </span>
            ))}
          </pre>
        </div>
      </div>
    </div>
  )
}

import type { ComponentType } from 'react'
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import type { ChallengeDetail, Submission } from '../types'
import { getStatusMeta } from '../lib/status'

type Props = {
  challenge: ChallengeDetail | null
  submission: Submission | null
  userHandle: string
  onHandleChange: (value: string) => void
}

type IconType = ComponentType<{ className?: string; size?: number }>

const severityIcon: Record<string, IconType> = {
  error: AlertTriangle,
  warning: Info,
  info: CheckCircle2,
}

export function InsightsPanel({ challenge, submission, userHandle, onHandleChange }: Props) {
  const issues = submission?.issues ?? []
  const latestStatus = getStatusMeta(submission?.status ?? null)

  return (
    <aside className="panel insights">
      <section className="insights__block">
        <h3 className="eyebrow">Identity</h3>
        <p className="muted small">Personalize submissions to track your progress across runs.</p>
        <label className="field">
          <span className="field__label">User handle</span>
          <input
            className="field__input"
            type="text"
            value={userHandle}
            placeholder="Anonymous"
            onChange={(event) => onHandleChange(event.target.value)}
          />
        </label>
      </section>

      <section className="insights__block">
        <h3 className="eyebrow">Acceptance criteria</h3>
        {challenge?.acceptance_criteria?.length ? (
          <ul className="list">
            {challenge.acceptance_criteria.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="muted small">No acceptance criteria defined for this challenge yet.</p>
        )}
      </section>

      <section className="insights__block">
        <div className="insights__header">
          <h3 className="eyebrow">Latest submission</h3>
          {latestStatus && (
            <span className={`status-badge status-badge--${latestStatus.tone}`}>{latestStatus.label}</span>
          )}
        </div>

        {submission ? (
          <div className="insights__content">
            {submission.score !== null && (
              <p className="small">
                <span className="small bold">Score:</span> {submission.score}
              </p>
            )}
            {submission.feedback && <p className="feedback">{submission.feedback}</p>}

            <div className="issues">
              {issues.length ? (
                issues.map((issue, index) => {
                  const Icon = severityIcon[issue.severity] ?? severityIcon.info
                  return (
                    <div key={`${issue.tool}-${index}`} className="issue">
                      <Icon className="issue__icon" size={16} />
                      <div>
                        <span className="issue__tool">{issue.tool}</span>
                        <p className="issue__message">{issue.message}</p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="muted small">No analyzer feedback yet.</p>
              )}
            </div>
          </div>
        ) : (
          <p className="muted small">Submit your fix to see analyzer feedback and scoring results.</p>
        )}
      </section>

      {challenge?.hints?.length ? (
        <section className="insights__block">
          <h3 className="eyebrow">Hints</h3>
          <ul className="list">
            {challenge.hints.map((hint, index) => (
              <li key={index}>{hint}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </aside>
  )
}

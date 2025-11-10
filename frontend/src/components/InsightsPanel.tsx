import type { ComponentType } from 'react'
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import type { Submission, SubmissionStatus } from '../types'
import { getStatusMeta } from '../lib/status'

type Props = {
  submission: Submission | null
  pendingStatus: SubmissionStatus | null
  className?: string
  variant?: 'panel' | 'inline'
}

type IconType = ComponentType<{ className?: string; size?: number }>

const severityIcon: Record<string, IconType> = {
  error: AlertTriangle,
  warning: Info,
  info: CheckCircle2,
}

export function TestResultPanel({ submission, pendingStatus, className, variant = 'panel' }: Props) {
  const issues = submission?.issues ?? []
  const score = submission?.score
  const feedback = submission?.feedback
  const statusMeta = getStatusMeta(pendingStatus ?? submission?.status ?? null)
  const hasResults = Boolean(submission)
  const isPending = Boolean(pendingStatus)

  const containerBaseClass = variant === 'panel' ? 'panel insights' : 'test-result-inline'
  const containerClass = [containerBaseClass, className].filter(Boolean).join(' ')
  const Container: React.ElementType = variant === 'panel' ? 'aside' : 'section'

  return (
    <Container className={containerClass}>
      <section className="insights__block">
        <div className="insights__header">
          <h3 className="eyebrow">Test result</h3>
          {statusMeta ? (
            <span className={`status-badge status-badge--${statusMeta.tone}`}>
              {isPending && <span className="status-badge__spinner" />}
              {statusMeta.label}
            </span>
          ) : null}
        </div>

        {hasResults ? (
          <div className="insights__content">
            {isPending ? <p className="muted small">Analyzers are still running. Results will update automatically.</p> : null}
            {score !== null && score !== undefined ? (
              <p className="small">
                <span className="small bold">Score:</span> {score}
              </p>
            ) : null}

            {feedback ? <p className="feedback">{feedback}</p> : null}

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
                <p className="muted small">No analyzer findings for this run.</p>
              )}
            </div>
          </div>
        ) : (
          <p className="muted small">
            Submit your fix to run analyzers and view scoring feedback. Results will appear here.
          </p>
        )}
      </section>
    </Container>
  )
}

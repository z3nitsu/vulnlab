import type { ChallengeDetail, Submission } from '../types'
import { getStatusBadgeClasses, getStatusLabel } from '../lib/status'
import clsx from 'clsx'

import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'

type Props = {
  challenge: ChallengeDetail | null
  submission: Submission | null
  userHandle: string
  onHandleChange: (value: string) => void
}

export function InsightsPanel({ challenge, submission, userHandle, onHandleChange }: Props) {
  const issues = submission?.issues ?? []

  return (
    <aside className="space-y-4">
      <div className="rounded-xl bg-surface.panel p-4 shadow-panel">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Identity</h3>
        </div>
        <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          User Handle
        </label>
        <input
          type="text"
          value={userHandle}
          onChange={(event) => onHandleChange(event.target.value)}
          placeholder="Anonymous"
          className="mt-2 w-full rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand.light focus:outline-none"
        />
      </div>

      <div className="rounded-xl bg-surface.panel p-4 shadow-panel">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Acceptance Criteria</h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-300">
          {challenge?.acceptance_criteria?.length
            ? challenge.acceptance_criteria.map((criteria, index) => (
                <li key={index}>{criteria}</li>
              ))
            : (
                <li className="text-slate-500">No acceptance criteria provided yet.</li>
              )}
        </ul>
      </div>

      <div className="rounded-xl bg-surface.panel p-4 shadow-panel">
        <div className="flex items-center justify-between pb-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Latest Submission</h3>
          {submission && (
            <span className={clsx('rounded-full px-3 py-1 text-xs font-semibold', getStatusBadgeClasses(submission.status))}>
              {getStatusLabel(submission.status)}
            </span>
          )}
        </div>
        {submission ? (
          <div className="space-y-3 text-sm text-slate-300">
            {submission.score !== null && (
              <p>
                <span className="font-semibold text-slate-200">Score:</span> {submission.score}
              </p>
            )}
            {submission.feedback && (
              <p className="rounded-lg bg-slate-900/70 p-3 text-xs leading-relaxed text-slate-200">
                {submission.feedback}
              </p>
            )}
            <div className="space-y-2">
              {issues.length ? (
                issues.map((issue, index) => {
                  const Icon = issue.severity === 'error'
                    ? AlertTriangle
                    : issue.severity === 'warning'
                      ? Info
                      : CheckCircle2
                  return (
                    <div
                      key={`${issue.tool}-${index}`}
                      className="flex items-start gap-2 rounded-lg bg-slate-900/60 p-3"
                    >
                      <Icon className="mt-1 h-4 w-4 text-brand.light" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          {issue.tool}
                        </p>
                        <p className="text-sm text-slate-200">{issue.message}</p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-slate-500">No analyzer feedback yet.</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Submit your fix to see analyzer feedback.</p>
        )}
      </div>

      {challenge?.hints?.length ? (
        <div className="rounded-xl bg-surface.panel p-4 shadow-panel">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Hints</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-300">
            {challenge.hints.map((hint, index) => (
              <li key={index}>{hint}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  )
}

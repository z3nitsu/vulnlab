import clsx from 'clsx'
import { Loader2 } from 'lucide-react'

import type { Submission, SubmissionStatus } from '../types'
import { getStatusBadgeClasses, getStatusLabel } from '../lib/status'

type Props = {
  code: string
  onCodeChange: (value: string) => void
  onSubmit: () => void
  onReset: () => void
  canSubmit: boolean
  pendingStatus: SubmissionStatus | null
  submission: Submission | null
}

export function EditorPanel({
  code,
  onCodeChange,
  onSubmit,
  onReset,
  canSubmit,
  pendingStatus,
  submission,
}: Props) {
  const status = pendingStatus ?? submission?.status ?? null

  return (
    <div className="flex flex-1 flex-col rounded-xl bg-surface.panel shadow-panel">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 text-sm text-slate-300">
        <span className="font-medium">Your Fix</span>
        <div className="flex items-center gap-3">
          {status && (
            <span className={clsx('rounded-full px-3 py-1 text-xs font-semibold', getStatusBadgeClasses(status))}>
              {pendingStatus ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {getStatusLabel(status)}
                </span>
              ) : (
                getStatusLabel(status)
              )}
            </span>
          )}
          <button
            type="button"
            onClick={onReset}
            className="rounded-md border border-slate-700 px-3 py-1.5 transition hover:border-brand.light hover:text-brand.light"
          >
            Reset Code
          </button>
        </div>
      </div>
      <textarea
        className="h-full flex-1 resize-none bg-transparent p-4 font-mono text-sm text-slate-100 outline-none"
        placeholder="Write your secure fix here..."
        value={code}
        onChange={(event) => onCodeChange(event.target.value)}
      />
      <div className="flex items-center justify-end gap-3 border-t border-slate-800 px-4 py-3">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit || !!pendingStatus}
          className={clsx(
            'rounded-md bg-brand.primary px-5 py-2 text-sm font-semibold text-white shadow-panel transition',
            'hover:bg-brand.dark',
            (!canSubmit || pendingStatus) && 'cursor-not-allowed opacity-60'
          )}
        >
          {pendingStatus ? 'Submitting…' : 'Submit Fix'}
        </button>
      </div>
    </div>
  )
}

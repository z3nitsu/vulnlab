import type { SubmissionStatus } from '../types'

export function getStatusBadgeClasses(status: SubmissionStatus) {
  switch (status) {
    case 'passed':
      return 'bg-green-500/20 text-green-300 border border-green-500/40'
    case 'failed':
      return 'bg-red-500/20 text-red-300 border border-red-500/40'
    case 'running':
      return 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
    case 'error':
      return 'bg-rose-500/20 text-rose-200 border border-rose-500/40'
    default:
      return 'bg-slate-500/20 text-slate-200 border border-slate-500/40'
  }
}

export function getStatusLabel(status: SubmissionStatus) {
  switch (status) {
    case 'passed':
      return 'Passed'
    case 'failed':
      return 'Failed'
    case 'running':
      return 'Running'
    case 'error':
      return 'Error'
    default:
      return 'Pending'
  }
}

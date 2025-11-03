export interface ChallengeSummary {
  slug: string
  title: string
  category: string
  language: string
}

export interface ChallengeDetail extends ChallengeSummary {
  description: string
  vulnerable_snippet: string
  acceptance_criteria: string[]
  hints: string[]
}

export type SubmissionStatus = 'pending' | 'running' | 'passed' | 'failed' | 'error'

export interface AnalysisIssue {
  tool: string
  message: string
  severity: string
}

export interface Submission {
  id: string
  challenge_slug: string
  user_handle: string | null
  code: string
  status: SubmissionStatus
  score: number | null
  feedback: string | null
  issues?: AnalysisIssue[] | null
  created_at: string
  updated_at: string
}

export interface SubmissionStats {
  total: number
  average_score: number | null
  status_counts: Array<{ status: SubmissionStatus; count: number }>
}

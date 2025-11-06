export type HeuristicSeverity = 'hint' | 'info' | 'warning'

export type HeuristicIssue = {
  id: string
  message: string
  severity: HeuristicSeverity
  range: {
    startLineNumber: number
    startColumn: number
    endLineNumber: number
    endColumn: number
  }
}

const makeIssue = (
  id: string,
  message: string,
  severity: HeuristicSeverity,
  line: number,
  startColumn: number,
  endColumn: number,
): HeuristicIssue => ({
  id,
  message,
  severity,
  range: {
    startLineNumber: line,
    startColumn,
    endLineNumber: line,
    endColumn,
  },
})

const analyzePython = (code: string): HeuristicIssue[] => {
  const lines = code.split(/\r?\n/)
  const issues: HeuristicIssue[] = []

  lines.forEach((line, index) => {
    const lineNumber = index + 1
    const trimmed = line.trim()
    const lowered = trimmed.toLowerCase()

    if (lowered.includes('select') && /f["']/.test(trimmed) && trimmed.includes('{')) {
      const col = Math.max(trimmed.toLowerCase().indexOf('select') + 1, 1)
      issues.push(
        makeIssue(
          `sql-fstring-${index}`,
          'Potential SQL string interpolation detected. Prefer parameterized queries.',
          'info',
          lineNumber,
          col,
          col + 6,
        ),
      )
    }

    if (lowered.includes('select') && /["']\s*\+\s*\w+/.test(trimmed)) {
      const concatIndex = Math.max(trimmed.indexOf('+') + 1, 1)
      issues.push(
        makeIssue(
          `sql-concat-${index}`,
          'Concatenating user input into SQL statements can lead to injection.',
          'warning',
          lineNumber,
          concatIndex,
          concatIndex + 1,
        ),
      )
    }

    if (lowered.includes('os.system')) {
      const col = Math.max(trimmed.toLowerCase().indexOf('os.system') + 1, 1)
      issues.push(
        makeIssue(
          `os-system-${index}`,
          'os.system executes commands in a shell. Consider subprocess without shell access.',
          'warning',
          lineNumber,
          col,
          col + 'os.system'.length,
        ),
      )
    }

    if (/subprocess\.(run|popen|call)/i.test(trimmed) && lowered.includes('shell=true')) {
      const col = Math.max(trimmed.toLowerCase().indexOf('shell') + 1, 1)
      issues.push(
        makeIssue(
          `shell-true-${index}`,
          'subprocess invoked with shell=True. Validate inputs carefully.',
          'info',
          lineNumber,
          col,
          col + 'shell'.length,
        ),
      )
    }
  })

  return issues
}

export const analyzeSnippet = (language: string | undefined, code: string): HeuristicIssue[] => {
  if (!code.trim()) return []
  switch ((language ?? 'python').toLowerCase()) {
    case 'python':
    default:
      return analyzePython(code)
  }
}

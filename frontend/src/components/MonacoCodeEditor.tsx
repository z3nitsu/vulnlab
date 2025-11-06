import { useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'
import type { Monaco, OnChange, OnMount } from '@monaco-editor/react'
import type { editor as MonacoEditor } from 'monaco-editor'

import { analyzeSnippet, type HeuristicIssue } from '../lib/heuristics'

type Props = {
  value: string
  language?: string
  onChange: (value: string) => void
  onIssuesChange?: (issues: HeuristicIssue[]) => void
}

type CodeEditor = MonacoEditor.IStandaloneCodeEditor

const THEME_NAME = 'vulnlabs-dark'

const defineTheme = (monaco: Monaco) => {
  monaco.editor.defineTheme(THEME_NAME, {
    base: 'vs-dark',
    inherit: true,
    colors: {
      'editor.background': '#0f172a',
      'editor.foreground': '#f8fafc',
      'editorLineNumber.foreground': '#7f8ab2',
      'editorLineNumber.activeForeground': '#c7d2fe',
      'editor.selectionBackground': '#2563eb4a',
      'editor.inactiveSelectionBackground': '#2563eb30',
      'editorCursor.foreground': '#f8fafc',
      'editor.lineHighlightBackground': '#14203c',
      'editorIndentGuide.background': '#1d2740',
      'editorIndentGuide.activeBackground': '#3b4674',
      'scrollbarSlider.background': '#1f2a4544',
      'scrollbarSlider.hoverBackground': '#2b356044',
      'scrollbarSlider.activeBackground': '#3b467455',
    },
    rules: [
      { token: '', foreground: 'F8FAFC' },
      { token: 'comment', foreground: 'A5B4FC', fontStyle: 'italic' },
      { token: 'keyword', foreground: '93C5FD', fontStyle: 'bold' },
      { token: 'string', foreground: 'FDE68A' },
      { token: 'number', foreground: 'FCA5A5' },
      { token: 'type.identifier', foreground: 'A5F3FC' },
      { token: 'delimiter', foreground: 'E2E8F0' },
      { token: 'operator', foreground: 'A5B4FC' },
      { token: 'function', foreground: 'BAE6FD' },
      { token: 'parameter', foreground: 'FBCFE8' },
    ],
  })
}

const severityClassName: Record<string, string> = {
  hint: 'editor-heuristic--hint',
  info: 'editor-heuristic--info',
  warning: 'editor-heuristic--warning',
  error: 'editor-heuristic--warning',
}

export function MonacoCodeEditor({ value, onChange, language, onIssuesChange }: Props) {
  const editorRef = useRef<CodeEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const decorationsRef = useRef<string[]>([])

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    defineTheme(monaco)
    editor.updateOptions({
      theme: THEME_NAME,
      fontFamily: 'JetBrains Mono, Fira Code, SFMono-Regular, Menlo, monospace',
      fontSize: 14,
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      smoothScrolling: true,
      wordWrap: 'on',
      cursorSmoothCaretAnimation: 'on',
      cursorBlinking: 'smooth',
      renderLineHighlight: 'all',
      glyphMargin: false,
      lineDecorationsWidth: 8,
      contextmenu: false,
      lightbulb: { enabled: monaco.editor.ShowLightbulbIconMode.Off },
      hover: { enabled: false },
      quickSuggestions: false,
      suggestOnTriggerCharacters: false,
      parameterHints: { enabled: false },
      codeLens: false,
      inlayHints: { enabled: 'off' },
      lineNumbersMinChars: 3,
    })

    // Ensure heuristics render on initial mount
    applyHeuristics(value)
  }

  const handleChange: OnChange = (nextValue) => {
    onChange(nextValue ?? '')
  }

  const applyHeuristics = (code: string) => {
    const editor = editorRef.current
    const monaco = monacoRef.current
    if (!editor || !monaco) return

    const issues = analyzeSnippet(language, code)
    onIssuesChange?.(issues)

    const decorations = issues.map((issue) => ({
      range: new monaco.Range(
        issue.range.startLineNumber,
        issue.range.startColumn,
        issue.range.endLineNumber,
        issue.range.endColumn,
      ),
      options: {
        inlineClassName: `editor-heuristic ${severityClassName[issue.severity] ?? severityClassName.info}`,
        stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
      },
    }))

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, decorations)
  }

  useEffect(() => {
    applyHeuristics(value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, language])

  return (
    <Editor
      language={language ?? 'python'}
      value={value}
      onChange={handleChange}
      onMount={handleMount}
      theme={THEME_NAME}
      options={{
        renderValidationDecorations: 'on',
        scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
      }}
      loading={
        <textarea
          className="editor__textarea editor__textarea--loading"
          value={value}
          readOnly
          placeholder="Loading editor…"
        />
      }
    />
  )
}

export default MonacoCodeEditor

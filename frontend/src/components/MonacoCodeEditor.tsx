import { useCallback, useEffect, useMemo, useRef } from 'react'
import Editor, { useMonaco } from '@monaco-editor/react'

type Monaco = typeof import('monaco-editor')
type CodeEditor = import('monaco-editor').editor.IStandaloneCodeEditor

type Props = {
  value: string
  language?: string
  onChange: (value: string) => void
}

export default function MonacoCodeEditor({ value, language = 'python', onChange }: Props) {
  const monaco = useMonaco()
  const editorRef = useRef<CodeEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)

  const handleChange = (nextValue: string | undefined) => {
    onChange(nextValue ?? '')
  }

  useEffect(() => {
    if (!monaco) return

    monaco.editor.defineTheme('vulnlabs-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: '', foreground: 'F9FBFF' },
        { token: 'comment', foreground: '9CA8D7', fontStyle: 'italic' },
        { token: 'keyword', foreground: '7DD3FC', fontStyle: 'bold' },
        { token: 'string', foreground: 'FBBF24' },
        { token: 'number', foreground: 'FCA5A5' },
        { token: 'type.identifier', foreground: 'A5F3FC' },
        { token: 'identifier', foreground: 'F9FBFF' },
        { token: 'variable', foreground: 'F9FBFF' },
        { token: 'parameter', foreground: 'FBCFE8' },
        { token: 'function', foreground: 'BAE6FD' },
        { token: 'delimiter', foreground: 'E2E8F0' },
        { token: 'operator', foreground: 'A5B4FC' },
      ],
      colors: {
        'editor.background': '#101b36',
        'editor.foreground': '#f9fbff',
        'editorLineNumber.foreground': '#7b88b3',
        'editorLineNumber.activeForeground': '#c7d2fe',
        'editor.selectionBackground': '#3b82f645',
        'editor.inactiveSelectionBackground': '#3b82f625',
        'editor.lineHighlightBackground': '#172549',
        'editorCursor.foreground': '#F8FAFC',
        'editorSuggestWidget.background': '#0f172a',
        'editorSuggestWidget.border': '#1d2a4a',
        'editorSuggestWidget.selectedBackground': '#1d4ed810',
        'editorMarkerNavigation.background': '#111827',
        'editorBracketMatch.background': '#1d4ed820',
        'editorBracketMatch.border': '#38bdf8',
        'editorError.foreground': '#fda4af',
        'editorError.background': '#7f1d1d30',
        'editorWarning.foreground': '#fde68a',
        'editorWarning.background': '#92400e30',
        'editorInfo.foreground': '#bfdbfe',
        'editorMarkerNavigationError.background': '#7f1d1d55',
        'editorMarkerNavigationWarning.background': '#92400e55',
        'editorMarkerNavigationInfo.background': '#1e3a8a55',
        'editorOverviewRulerError': '#f87171aa',
        'editorOverviewRulerWarning': '#fbbf24aa',
        'editorOverviewRulerInfo': '#60a5faaa',
        'minimap.errorHighlight': '#f8717111',
        'minimap.warningHighlight': '#fbbf2411',
        'minimap.infoHighlight': '#60a5fa11',
        'editorHoverWidget.background': '#101a33',
        'editorHoverWidget.foreground': '#e2e8f0',
        'editorHoverWidget.border': '#1d2a4a',
        'editorHoverWidget.highlightForeground': '#facc15',
        'editorWidget.background': '#101a33',
        'editorWidget.border': '#1d2a4a',
        'editorGutter.background': '#0b1020',
        'editorCodeLens.foreground': '#94a3b8',
        'peekViewEditor.background': '#101a33',
        'peekViewEditor.matchHighlightBackground': '#1d4ed830',
        'peekViewResults.background': '#0b1429',
        'peekViewResults.selectionBackground': '#1d4ed840',
        'peekViewResults.fileForeground': '#e2e8f0',
        'peekViewResults.selectionForeground': '#e2e8f0',
        'peekViewTitle.background': '#0b1429',
        'peekViewTitleLabel.foreground': '#e2e8f0',
        'peekViewTitleDescription.foreground': '#94a3b8',
        'scrollbarSlider.background': '#1d2540c0',
        'scrollbarSlider.hoverBackground': '#1f2c53c0',
        'scrollbarSlider.activeBackground': '#243263cc',
      },
    })
  }, [monaco])

  const patterns = useMemo(
    () => ({
      stringConcat: /\+\s*\w+/,
      osSystem: /os\.system\s*\(/,
      shellTrue: /subprocess\.(run|popen|call)[^)]*shell\s*=\s*True/i,
      execEval: /\b(exec|eval)\s*\(/,
    }),
    [],
  )

  const applyHeuristicMarkers = useCallback(() => {
    const monacoInstance = monacoRef.current
    const editor = editorRef.current
    if (!monacoInstance || !editor) return

    const model = editor.getModel()
    if (!model) return

    const code = model.getValue()
    const lines = code.split(/\r?\n/)
    const markers: import('monaco-editor').editor.IMarkerData[] = []

    const pushMarker = (
      lineNumber: number,
      startColumn: number,
      endColumn: number,
      message: string,
      severity: import('monaco-editor').MarkerSeverity = monacoInstance.MarkerSeverity.Hint,
    ) => {
      markers.push({
        startLineNumber: lineNumber,
        endLineNumber: lineNumber,
        startColumn,
        endColumn,
        message,
        severity,
        source: 'VulnLabs heuristics',
      })
    }

    lines.forEach((line, index) => {
      const lineNumber = index + 1
      const normalized = line.toLowerCase()

      if (language === 'python') {
        if (normalized.includes('select') && /f["']/.test(line) && line.includes('{')) {
          const indexOfSelect = normalized.indexOf('select')
          const col = indexOfSelect >= 0 ? indexOfSelect + 1 : 1
          pushMarker(lineNumber, col, col + 6, 'Potential SQL f-string detected. Use parameterized queries instead of string interpolation.')
        } else if (normalized.includes('select') && patterns.stringConcat.test(line)) {
          const concatIndex = line.indexOf('+')
          const col = concatIndex >= 0 ? concatIndex + 1 : 1
          pushMarker(lineNumber, col, col + 1, 'SQL string concatenation detected. Prefer prepared statements with bind parameters.')
        }

        if (patterns.osSystem.test(line)) {
          const systemIndex = normalized.indexOf('os.system')
          const col = systemIndex >= 0 ? systemIndex + 1 : 1
          pushMarker(lineNumber, col, col + 'os.system'.length, "Call to os.system detected. Consider using subprocess without shell access.")
        }

        if (patterns.shellTrue.test(line)) {
          const col = line.toLowerCase().indexOf('shell') + 1 || 1
          pushMarker(
            lineNumber,
            col,
            col + 'shell'.length,
            'subprocess invoked with shell=True. This may be vulnerable to command injection.',
            monacoInstance.MarkerSeverity.Info
          )
        }

        if (patterns.execEval.test(line)) {
          const col = line.toLowerCase().indexOf('exec') + 1 || line.toLowerCase().indexOf('eval') + 1 || 1
          pushMarker(lineNumber, col, col + 4, 'Use of exec/eval detected. Avoid executing dynamic code from user input.')
        }
      }
    })

    monacoInstance.editor.setModelMarkers(model, 'vulnlabs-heuristics', markers)
  }, [language, patterns])

  useEffect(() => {
    if (!monaco) return
    monacoRef.current = monaco
  }, [monaco])

  useEffect(() => {
    applyHeuristicMarkers()
  }, [value, language, applyHeuristicMarkers])

  const handleMount = (editor: CodeEditor, monacoInstance: Monaco) => {
    editorRef.current = editor
    monacoRef.current = monacoInstance
    editor.updateOptions({
      formatOnPaste: true,
      formatOnType: true,
      quickSuggestions: true,
      suggestOnTriggerCharacters: true,
      tabCompletion: 'on',
    })
    applyHeuristicMarkers()
  }

  return (
    <Editor
      language={language}
      value={value}
      onChange={handleChange}
      onMount={handleMount}
      theme="vulnlabs-dark"
      height="360px"
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        renderLineHighlight: 'line',
        fontFamily: 'JetBrains Mono, Fira Code, SFMono-Regular, Menlo, monospace',
        tabSize: 4,
        wordWrap: 'on',
        smoothScrolling: true,
        padding: {
          top: 16,
          bottom: 16,
        },
        scrollbar: {
          verticalScrollbarSize: 8,
          horizontalScrollbarSize: 8,
        },
        glyphMargin: true,
        renderWhitespace: 'boundary',
        folding: true,
        guides: {
          indentation: true,
        },
      }}
    />
  )
}

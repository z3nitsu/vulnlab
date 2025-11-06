import Editor from '@monaco-editor/react'

type Props = {
  value: string
  language?: string
  onChange: (value: string) => void
}

export default function MonacoCodeEditor({ value, language = 'python', onChange }: Props) {
  const handleChange = (nextValue: string | undefined) => {
    onChange(nextValue ?? '')
  }

  return (
    <Editor
      language={language}
      value={value}
      onChange={handleChange}
      theme="vs-dark"
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
      }}
    />
  )
}

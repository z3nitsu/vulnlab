import Editor from '@monaco-editor/react'

type Props = {
  value: string
  language?: string
  onChange: (value: string) => void
}

export default function MonacoCodeEditor({ value, onChange, language }: Props) {
  const handleChange = (nextValue: string | undefined) => {
    onChange(nextValue ?? '')
  }

  return (
    <Editor
      value={value}
      onChange={handleChange}
      language={language ?? 'python'}
      theme="vs-dark"
      height="420px"
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        smoothScrolling: true,
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        automaticLayout: true,
        contextmenu: false,
      }}
    />
  )
}

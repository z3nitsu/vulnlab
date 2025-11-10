import Editor from '@monaco-editor/react'

type Props = {
  value: string
  language?: string
  onChange: (value: string) => void
  height?: string | number
}

export default function MonacoCodeEditor({ value, onChange, language, height = '100%' }: Props) {
  const handleChange = (nextValue: string | undefined) => {
    onChange(nextValue ?? '')
  }

  return (
    <Editor
      value={value}
      onChange={handleChange}
      language={language ?? 'python'}
      theme="vs-dark"
      height={height}
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

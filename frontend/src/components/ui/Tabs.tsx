import { useId, useState } from 'react'

export type TabDefinition = {
  id: string
  label: string
  content: React.ReactNode
  disabled?: boolean
}

type TabsProps = {
  tabs: TabDefinition[]
  initialTabId?: string
  onChange?: (tabId: string) => void
}

export function Tabs({ tabs, initialTabId, onChange }: TabsProps) {
  const fallbackTabId = tabs.find((tab) => !tab.disabled)?.id
  const [activeId, setActiveId] = useState(initialTabId ?? fallbackTabId ?? '')
  const tablistId = useId()

  const handleSelect = (tabId: string) => {
    setActiveId(tabId)
    onChange?.(tabId)
  }

  const activeTab = tabs.find((tab) => tab.id === activeId)

  return (
    <div className="tabs">
      <div className="tabs__list" role="tablist" aria-labelledby={tablistId}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeId
          return (
            <button
              key={tab.id}
              className={`tabs__trigger${isActive ? ' tabs__trigger--active' : ''}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`${tablistId}-${tab.id}`}
              disabled={tab.disabled}
              type="button"
              onClick={() => handleSelect(tab.id)}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      <div
        id={`${tablistId}-${activeTab?.id ?? ''}`}
        role="tabpanel"
        className="tabs__content"
      >
        {activeTab?.content}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'

interface Tab {
  id: string
  label: string
  icon: string
}

interface ProfileTabsProps {
  tabs: Tab[]
  onTabChange: (tabId: string) => void
  activeTab: string
}

export function ProfileTabs({ tabs, onTabChange, activeTab }: ProfileTabsProps) {
  return (
    <div className="border-b border-gray-200 bg-white rounded-t-lg">
      <div className="flex flex-wrap gap-0 -mb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              px-4 sm:px-6 py-3 sm:py-4 font-medium text-sm sm:text-base whitespace-nowrap
              border-b-2 transition-colors duration-200
              ${
                activeTab === tab.id
                  ? 'border-coral-500 text-coral-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }
            `}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}

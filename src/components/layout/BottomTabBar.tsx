'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Tag, Heart, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TabItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  activePattern?: RegExp
}

const tabs: TabItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    href: '/',
    activePattern: /^\/$/
  },
  {
    id: 'ofertas',
    label: 'Marketplace',
    icon: Tag,
    href: '/products',
    activePattern: /^\/products/
  },
  {
    id: 'liked',
    label: 'Liked',
    icon: Heart,
    href: '/favorites',
    activePattern: /^\/favorites/
  },
  {
    id: 'perfil',
    label: 'Perfil',
    icon: User,
    href: '/profile',
    activePattern: /^\/profile/
  }
]

export function BottomTabBar() {
  const pathname = usePathname()

  const isTabActive = (tab: TabItem) => {
    if (tab.activePattern) {
      return tab.activePattern.test(pathname)
    }
    return pathname === tab.href
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <nav 
        className="flex items-center justify-around py-3 px-2"
        role="tablist"
        aria-label="Navegação principal"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = isTabActive(tab)
          
          return (
            <Link
              key={tab.id}
              href={tab.href}
              role="tab"
              aria-selected={isActive}
              aria-label={`Navegar para ${tab.label}`}
              className={cn(
                'flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200',
                'min-w-0 flex-1 max-w-20 active:scale-95',
                isActive
                  ? 'text-coral-500 bg-coral-50'
                  : 'text-gray-500 hover:text-coral-400 hover:bg-gray-50'
              )}
            >
              <Icon 
                className={cn(
                  'w-6 h-6 mb-1',
                  isActive ? 'text-coral-500' : 'text-gray-500'
                )} 
                aria-hidden="true"
              />
              <span 
                className={cn(
                  'text-xs font-medium truncate',
                  isActive ? 'text-coral-500' : 'text-gray-500'
                )}
              >
                {tab.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
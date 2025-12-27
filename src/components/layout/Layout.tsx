import { ReactNode } from 'react'
import { Header } from './Header'
import { Footer } from './Footer'
import { BottomTabBar } from './BottomTabBar'
import { cn } from '@/lib/utils'

interface LayoutProps {
  children: ReactNode
  className?: string
}

export function Layout({ children, className }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className={cn('flex-1 pb-24 md:pb-0', className)}>
        {children}
      </main>
      <Footer />
      <BottomTabBar />
    </div>
  )
}
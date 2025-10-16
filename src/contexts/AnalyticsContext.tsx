'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { AnalyticsService } from '@/services/analyticsService'

interface AnalyticsContextType {
  isInitialized: boolean
  hasConsent: boolean
  setConsent: (consent: boolean) => void
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined)

interface AnalyticsProviderProps {
  children: ReactNode
  googleAnalyticsId?: string
}

export function AnalyticsProvider({ 
  children, 
  googleAnalyticsId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID 
}: AnalyticsProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [hasConsent, setHasConsent] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Marca que está no cliente
    setIsClient(true)
    
    // Only run on client side
    if (typeof window === 'undefined') return

    // Verifica se já tem consentimento salvo
    const savedConsent = localStorage.getItem('xeco_analytics_consent')
    const consent = savedConsent === 'true'
    
    setHasConsent(consent)

    // Inicializa Google Analytics se tiver ID
    if (googleAnalyticsId) {
      AnalyticsService.initializeGoogleAnalytics(googleAnalyticsId)
    }

    // Configura consentimento
    const analytics = AnalyticsService.getInstance()
    analytics.setAnalyticsConsent(consent)

    setIsInitialized(true)

    // REMOVIDO: Não registra page view aqui para evitar duplicata
    // O AnalyticsService já faz isso automaticamente
  }, [googleAnalyticsId])

  const setConsent = (consent: boolean) => {
    setHasConsent(consent)
    
    // Only access localStorage on client side
    if (typeof window !== 'undefined') {
      localStorage.setItem('xeco_analytics_consent', consent.toString())
    }
    
    const analytics = AnalyticsService.getInstance()
    analytics.setAnalyticsConsent(consent)

    if (consent) {
      // REMOVIDO: Não registra page view aqui para evitar duplicata
      // O handlePageChange já cuida disso quando necessário
    }
  }

  return (
    <AnalyticsContext.Provider value={{
      isInitialized,
      hasConsent,
      setConsent
    }}>
      {children}
    </AnalyticsContext.Provider>
  )
}

export function useAnalyticsContext() {
  const context = useContext(AnalyticsContext)
  if (context === undefined) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider')
  }
  return context
}
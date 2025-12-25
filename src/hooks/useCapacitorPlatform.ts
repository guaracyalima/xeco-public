'use client'

import { useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'

/**
 * Hook para detectar se estamos rodando em ambiente Capacitor (mobile app)
 * vs ambiente web (browser)
 */
export function useCapacitorPlatform() {
  const [isNative, setIsNative] = useState(false)
  const [platform, setPlatform] = useState<string>('web')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Verifica se estamos em ambiente Capacitor
    const checkPlatform = () => {
      try {
        const isNativeApp = Capacitor.isNativePlatform()
        const currentPlatform = Capacitor.getPlatform()
        
        setIsNative(isNativeApp)
        setPlatform(currentPlatform)
        setIsLoading(false)
        
        console.log('🔍 [Platform Detection]', {
          isNative: isNativeApp,
          platform: currentPlatform,
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR'
        })
      } catch (error) {
        // Fallback para ambiente web
        console.warn('⚠️ [Platform Detection] Capacitor não disponível, usando web fallback')
        setIsNative(false)
        setPlatform('web')
        setIsLoading(false)
      }
    }

    checkPlatform()
  }, [])

  return {
    /**
     * True se estiver rodando em app mobile (iOS/Android)
     */
    isNative,
    /**
     * True se estiver rodando no navegador web
     */
    isWeb: !isNative,
    /**
     * Plataforma atual: 'ios', 'android', 'web'
     */
    platform,
    /**
     * True se ainda estiver detectando a plataforma
     */
    isLoading,
    /**
     * True se estiver rodando no iOS
     */
    isIOS: platform === 'ios',
    /**
     * True se estiver rodando no Android
     */
    isAndroid: platform === 'android'
  }
}
'use client'

import { useEffect } from 'react'

export function PWARegister() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      (window as any).workbox !== undefined
    ) {
      const wb = (window as any).workbox

      // Log quando uma nova versão está disponível
      wb.addEventListener('waiting', () => {
        console.log('🔄 Nova versão do app disponível!')
        
        // Perguntar ao usuário se quer atualizar
        if (confirm('Nova versão disponível! Deseja atualizar agora?')) {
          wb.messageSkipWaiting()
          window.location.reload()
        }
      })

      wb.register()
    } else if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Fallback: registrar service worker manualmente
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .then((registration) => {
            console.log('✅ Service Worker registrado:', registration.scope)

            // Verificar atualizações
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing
              
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (
                    newWorker.state === 'installed' &&
                    navigator.serviceWorker.controller
                  ) {
                    console.log('🔄 Nova versão do app disponível!')
                    
                    // Perguntar ao usuário se quer atualizar
                    if (confirm('Nova versão disponível! Deseja atualizar agora?')) {
                      newWorker.postMessage({ type: 'SKIP_WAITING' })
                      window.location.reload()
                    }
                  }
                })
              }
            })
          })
          .catch((error) => {
            console.error('❌ Erro ao registrar Service Worker:', error)
          })

        // Recarregar quando o novo service worker assumir o controle
        let refreshing = false
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshing) return
          refreshing = true
          window.location.reload()
        })
      })
    }
  }, [])

  return null
}

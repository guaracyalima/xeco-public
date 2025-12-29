'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Capacitor } from '@capacitor/core'
import { App, URLOpenListenerEvent } from '@capacitor/app'
import { Browser } from '@capacitor/browser'

/**
 * Hook para capturar Deep Links e redirecionar para as páginas corretas no app
 * Isso permite que callbacks de pagamento (Asaas) retornem ao app
 */
export function useDeepLinks() {
  const router = useRouter()

  useEffect(() => {
    // Só executa em plataformas nativas (Android/iOS)
    if (Capacitor.getPlatform() === 'web') {
      return
    }

    const handleDeepLink = async (event: URLOpenListenerEvent) => {
      console.log('🔗 Deep Link recebido:', event.url)
      
      try {
        const url = new URL(event.url)
        const pathname = url.pathname
        const searchParams = url.searchParams

        // Fecha o browser in-app se estiver aberto
        try {
          await Browser.close()
        } catch {
          // Browser pode não estar aberto
        }

        // Rotas de checkout
        if (pathname.startsWith('/checkout/')) {
          const route = pathname.replace('/checkout/', '')
          
          switch (route) {
            case 'success':
              console.log('✅ Pagamento bem-sucedido!')
              router.push('/checkout/success')
              break
            case 'cancel':
              console.log('❌ Pagamento cancelado')
              router.push('/checkout/cancel')
              break
            case 'expired':
              console.log('⏰ Pagamento expirado')
              router.push('/checkout/expired')
              break
            default:
              // Pode ter um orderId como /checkout/success?orderId=xxx
              const orderId = searchParams.get('orderId')
              if (orderId) {
                router.push(`/orders/${orderId}`)
              } else {
                router.push('/profile?tab=orders')
              }
          }
          return
        }

        // Custom URL scheme: xuxum://checkout/success
        if (event.url.startsWith('xuxum://')) {
          const customPath = event.url.replace('xuxum://', '')
          
          if (customPath.startsWith('checkout/')) {
            const route = customPath.replace('checkout/', '')
            router.push(`/checkout/${route}`)
            return
          }
        }

        // Fallback: navega para a home
        console.log('🏠 Deep Link não reconhecido, indo para home')
        router.push('/')
        
      } catch (error) {
        console.error('Erro ao processar deep link:', error)
        router.push('/')
      }
    }

    // Registra o listener
    const listener = App.addListener('appUrlOpen', handleDeepLink)

    // Cleanup
    return () => {
      listener.then(l => l.remove())
    }
  }, [router])
}

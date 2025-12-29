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
          // Preserva query params (order, orderId, etc)
          const queryString = url.search || ''
          
          console.log('🔗 [DEEP LINK] Route:', route)
          console.log('🔗 [DEEP LINK] Query string:', queryString)
          
          switch (route) {
            case 'success':
              console.log('✅ Pagamento bem-sucedido!')
              router.push(`/checkout/success${queryString}`)
              break
            case 'cancel':
              console.log('❌ Pagamento cancelado')
              router.push(`/checkout/cancel${queryString}`)
              break
            case 'expired':
              console.log('⏰ Pagamento expirado')
              router.push(`/checkout/expired${queryString}`)
              break
            default:
              // Pode ter um orderId como /checkout/success?orderId=xxx
              const orderId = searchParams.get('orderId') || searchParams.get('order')
              if (orderId) {
                router.push(`/orders/${orderId}`)
              } else {
                router.push('/profile?tab=orders')
              }
          }
          return
        }

        // Custom URL scheme: xuxum://checkout/success?orderId=xxx
        if (event.url.startsWith('xuxum://')) {
          const customUrl = new URL(event.url.replace('xuxum://', 'https://dummy.com/'))
          const customPath = customUrl.pathname.replace('/', '')
          const customQuery = customUrl.search || ''
          
          console.log('🔗 [DEEP LINK] Custom path:', customPath)
          console.log('🔗 [DEEP LINK] Custom query:', customQuery)
          
          if (customPath.startsWith('checkout/')) {
            const route = customPath.replace('checkout/', '')
            router.push(`/checkout/${route}${customQuery}`)
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

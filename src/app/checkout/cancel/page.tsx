'use client'

import { useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Layout } from '@/components/layout/Layout'
import { XCircle, Loader2, ArrowLeft, RefreshCw } from 'lucide-react'

export const dynamic = 'force-dynamic'

/**
 * Tenta abrir o app mobile via Custom URL Scheme
 */
function tryOpenMobileApp(path: string) {
  const userAgent = navigator.userAgent
  const isMobile = /Android|iPhone|iPad|iPod/i.test(userAgent)
  const isAndroid = /Android/i.test(userAgent)
  
  console.log('🔗 [DEEP LINK] ==========================================')
  console.log('🔗 [DEEP LINK] Tentando redirecionar para o app...')
  console.log('🔗 [DEEP LINK] User Agent:', userAgent)
  console.log('🔗 [DEEP LINK] É mobile?', isMobile)
  console.log('🔗 [DEEP LINK] É Android?', isAndroid)
  console.log('🔗 [DEEP LINK] Path:', path)
  
  if (!isMobile) {
    console.log('🔗 [DEEP LINK] ❌ Não é mobile, ignorando')
    return false
  }

  console.log('� [DEEP LINK] ✅ Mobile detectado, tentando abrir app...')
  
  const appUrl = `xuxum://${path}`
  console.log('🔗 [DEEP LINK] Custom scheme URL:', appUrl)
  
  const iframe = document.createElement('iframe')
  iframe.style.display = 'none'
  iframe.src = appUrl
  document.body.appendChild(iframe)
  
  if (isAndroid) {
    const intentUrl = `intent://${path}#Intent;scheme=xuxum;package=com.xuxum.app;end`
    console.log('🔗 [DEEP LINK] Intent URL (Android):', intentUrl)
    setTimeout(() => {
      console.log('🔗 [DEEP LINK] Redirecionando para intent URL...')
      window.location.href = intentUrl
    }, 100)
  }
  
  setTimeout(() => {
    document.body.removeChild(iframe)
  }, 2000)
  
  console.log('🔗 [DEEP LINK] ==========================================')
  return true
}

function CheckoutCancelContent() {
  const router = useRouter()

  useEffect(() => {
    tryOpenMobileApp('checkout/cancel')
  }, [])

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-br from-red-50 to-orange-50 px-8 py-10 text-center border-b border-red-200">
            <div className="mx-auto w-24 h-24 bg-red-500 rounded-full flex items-center justify-center mb-6">
              <XCircle className="w-16 h-16 text-white" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Pagamento Cancelado
            </h1>
            
            <p className="text-gray-600 text-lg">
              Você cancelou o processo de pagamento.
            </p>
          </div>

          <div className="px-8 py-6 space-y-4">
            <p className="text-gray-600 text-center">
              Seu carrinho ainda está salvo. Você pode tentar novamente quando quiser.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => router.push('/cart')}
                className="w-full bg-coral-500 text-white py-3 rounded-lg hover:bg-coral-600 transition-all font-semibold flex items-center justify-center"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Tentar novamente
              </button>

              <button
                onClick={() => router.push('/')}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-all font-semibold flex items-center justify-center"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Voltar para a loja
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default function CheckoutCancelPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-coral-500" />
        </div>
      </Layout>
    }>
      <CheckoutCancelContent />
    </Suspense>
  )
}

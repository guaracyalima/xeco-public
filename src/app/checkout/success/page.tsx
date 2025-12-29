'use client'

import { useEffect, useState, Suspense } from 'react'
import { useCart } from '@/contexts/CartContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { Layout } from '@/components/layout/Layout'
import { CheckCircle, Loader2, Package, DollarSign } from 'lucide-react'
import { OrderService } from '@/services/orderService'
import { Order } from '@/types/order'

// Force this page to be dynamic (no static generation)
export const dynamic = 'force-dynamic'

/**
 * Tenta abrir o app mobile via Custom URL Scheme
 * Funciona independente das configurações de App Links do usuário
 */
function tryOpenMobileApp(path: string = 'checkout/success') {
  // Detecta se é mobile pelo user agent
  const userAgent = navigator.userAgent
  const isMobile = /Android|iPhone|iPad|iPod/i.test(userAgent)
  const isAndroid = /Android/i.test(userAgent)
  
  console.log('🔗 [DEEP LINK] ==========================================')
  console.log('🔗 [DEEP LINK] Tentando redirecionar para o app...')
  console.log('🔗 [DEEP LINK] User Agent:', userAgent)
  console.log('🔗 [DEEP LINK] É mobile?', isMobile)
  console.log('🔗 [DEEP LINK] É Android?', isAndroid)
  console.log('🔗 [DEEP LINK] Path:', path)
  console.log('🔗 [DEEP LINK] Search params:', window.location.search)
  
  if (!isMobile) {
    console.log('� [DEEP LINK] ❌ Não é mobile, ignorando redirecionamento para app')
    return false
  }

  console.log('� [DEEP LINK] ✅ Mobile detectado, tentando abrir app...')
  
  // Tenta abrir via custom scheme (xuxum://)
  const appUrl = `xuxum://${path}${window.location.search}`
  console.log('🔗 [DEEP LINK] Custom scheme URL:', appUrl)
  
  // Cria um iframe invisível para tentar abrir o app
  // Isso evita que a página atual seja substituída se o app não estiver instalado
  const iframe = document.createElement('iframe')
  iframe.style.display = 'none'
  iframe.src = appUrl
  document.body.appendChild(iframe)
  console.log('🔗 [DEEP LINK] Iframe criado com src:', appUrl)
  
  // Também tenta via intent:// para Android (mais confiável)
  if (isAndroid) {
    const intentUrl = `intent://${path}${window.location.search}#Intent;scheme=xuxum;package=com.xuxum.app;end`
    console.log('🔗 [DEEP LINK] Intent URL (Android):', intentUrl)
    
    // Usa setTimeout para dar tempo do iframe tentar primeiro
    setTimeout(() => {
      console.log('🔗 [DEEP LINK] Redirecionando para intent URL...')
      window.location.href = intentUrl
    }, 100)
  }
  
  // Remove o iframe após 2 segundos
  setTimeout(() => {
    document.body.removeChild(iframe)
    console.log('🔗 [DEEP LINK] Iframe removido')
  }, 2000)
  
  console.log('🔗 [DEEP LINK] ==========================================')
  return true
}

function CheckoutSuccessContent() {
  const { clearCart } = useCart()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [countdown, setCountdown] = useState(10) // 10 segundos
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  // Tenta abrir o app mobile assim que a página carrega
  // Usa window.location.search diretamente porque searchParams pode estar vazio no primeiro render
  useEffect(() => {
    // Pega orderId diretamente da URL
    const urlParams = new URLSearchParams(window.location.search)
    const orderId = urlParams.get('order') || urlParams.get('orderId')
    
    console.log('🔗 [DEEP LINK] window.location.search:', window.location.search)
    console.log('🔗 [DEEP LINK] orderId extraído:', orderId)
    
    if (orderId) {
      tryOpenMobileApp(`checkout/success?orderId=${orderId}`)
    } else {
      tryOpenMobileApp('checkout/success')
    }
  }, [])

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        // Buscar orderId do searchParams ou localStorage
        const orderIdFromUrl = searchParams.get('order')
        const orderIdFromStorage = localStorage.getItem('pendingOrderId')
        const orderId = orderIdFromUrl || orderIdFromStorage
        
        console.log('🔍 Buscando detalhes do pedido:', orderId)
        
        if (!orderId) {
          console.log('❌ Nenhum orderId encontrado, redirecionando...')
          router.push('/')
          return
        }

        // Buscar dados do pedido do Firestore
        const orderData = await OrderService.getOrder(orderId)
        
        if (orderData) {
          console.log('✅ Pedido encontrado:', orderData)
          console.log('🔍 Validando status do pagamento:', orderData.paymentStatus)
          
          // 🚨 VALIDAÇÃO INTELIGENTE - Só permite sucesso se pagamento confirmado
          if (orderData.paymentStatus !== 'CONFIRMED') {
            console.log('❌ Pagamento não confirmado, redirecionando para status do pedido...')
            // Redireciona para página de status do pedido onde pode acompanhar
            router.push(`/order/${orderData.id}/status`)
            return
          }
          
          console.log('✅ Pagamento confirmado! Mostrando página de sucesso')
          setOrder(orderData)
          
          // Limpar carrinho apenas se pagamento confirmado
          console.log('🧹 Limpando carrinho...')
          clearCart()
          
          // Limpar localStorage
          localStorage.removeItem('pendingOrderId')
          
          // Iniciar countdown
          const interval = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(interval)
                router.push(`/profile?tab=pedidos`)
                return 0
              }
              return prev - 1
            })
          }, 1000)

          setLoading(false)
          return () => clearInterval(interval)
        } else {
          console.log('⚠️ Pedido não encontrado')
          setLoading(false)
          // Mesmo sem encontrar, redireciona após 3s
          setTimeout(() => router.push('/profile?tab=pedidos'), 3000)
        }
      } catch (error) {
        console.error('❌ Erro ao buscar detalhes do pedido:', error)
        setLoading(false)
        setTimeout(() => router.push('/profile?tab=pedidos'), 3000)
      }
    }

    fetchOrderDetails()
  }, [clearCart, router, searchParams])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-coral-500 mx-auto mb-4" />
            <p className="text-gray-600">Carregando detalhes do pedido...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header de Sucesso */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 px-8 py-10 text-center border-b border-green-200">
            <div className="mx-auto w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 animate-bounce">
              <CheckCircle className="w-16 h-16 text-white" />
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Pedido Realizado! 🎉
            </h1>
            
            <p className="text-gray-600 text-lg mb-2">
              Seu pedido foi criado com sucesso!
            </p>
            
            {order && (
              <p className="text-sm text-gray-500">
                Número do pedido: <span className="font-mono font-semibold text-gray-700">#{order.id.slice(-8).toUpperCase()}</span>
              </p>
            )}
          </div>

          {/* Detalhes do Pedido */}
          {order && (
            <div className="px-8 py-6 space-y-6">
              {/* Resumo do Pedido */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Package className="w-5 h-5 mr-2 text-coral-500" />
                  Itens do Pedido
                </h2>
                
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.productName}</p>
                        <p className="text-sm text-gray-500">Quantidade: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-gray-900">
                        {formatPrice(item.totalPrice)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between pt-2">
                  <span className="text-lg font-semibold text-gray-900 flex items-center">
                    <DollarSign className="w-5 h-5 mr-1 text-coral-500" />
                    Total do Pedido
                  </span>
                  <span className="text-2xl font-bold text-coral-500">
                    {formatPrice(order.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Status */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm font-medium mb-2">
                  📧 Acompanhe seu pedido
                </p>
                <p className="text-blue-600 text-sm">
                  Você receberá atualizações por email sobre o status do pagamento e entrega.
                </p>
                <p className="text-blue-600 text-xs mt-2">
                  Status do pagamento: <span className="font-semibold">{order.paymentStatus || 'PENDENTE'}</span>
                </p>
              </div>
            </div>
          )}

          {/* Footer com Ações */}
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
            {/* Countdown */}
            <div className="flex items-center justify-center space-x-2 text-gray-500 mb-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              <p className="text-sm">
                Redirecionando para seus pedidos em {countdown}s...
              </p>
            </div>

            {/* Botão Manual */}
            <button
              onClick={() => router.push('/profile?tab=pedidos')}
              className="view-all-btn w-full bg-coral-500 py-3 rounded-lg hover:bg-coral-600 transition-all duration-200 font-semibold transform hover:scale-105"
            >
              Ver meus pedidos agora
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-coral-500" />
        </div>
      </Layout>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  )
}

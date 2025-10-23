'use client'

import { useEffect, useState } from 'react'
import { useCart } from '@/contexts/CartContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { Layout } from '@/components/layout/Layout'
import { CheckCircle, Loader2 } from 'lucide-react'

export default function CheckoutSuccessPage() {
  const { clearCart } = useCart()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    // ✅ Limpar carrinho quando entrar na página de sucesso
    const orderId = searchParams.get('orderId') || localStorage.getItem('pendingOrderId')
    
    if (orderId) {
      console.log('✅ Checkout iniciado com sucesso! Order ID:', orderId)
      console.log('🧹 Limpando carrinho...')
      
      // Limpar carrinho
      clearCart()
      
      // Limpar localStorage
      localStorage.removeItem('pendingOrderId')
      
      // Countdown
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            router.push(`/perfil?tab=pedidos`)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(interval)
    } else {
      // Se não tem orderId, redirecionar para home
      router.push('/')
    }
  }, [clearCart, router, searchParams])

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          {/* Ícone de Sucesso */}
          <div className="mb-6">
            <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
          </div>

          {/* Título */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Pedido Realizado! 🎉
          </h1>

          {/* Descrição */}
          <p className="text-gray-600 mb-6">
            Seu pedido foi criado com sucesso e enviado para pagamento.
            <br />
            <span className="text-sm">
              Você receberá um email de confirmação em breve.
            </span>
          </p>

          {/* Status */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm mb-2">
              📧 Acompanhe seu pedido pelo email cadastrado
            </p>
            <p className="text-blue-600 text-xs">
              Processando pagamento...
            </p>
          </div>

          {/* Countdown */}
          <div className="flex items-center justify-center space-x-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <p className="text-sm">
              Redirecionando em {countdown}s...
            </p>
          </div>

          {/* Botão Manual */}
          <button
            onClick={() => router.push('/perfil?tab=pedidos')}
            className="mt-6 w-full bg-coral-500 text-white py-3 rounded-lg hover:bg-coral-600 transition-colors font-semibold"
          >
            Ver Meus Pedidos
          </button>
        </div>
      </div>
    </Layout>
  )
}

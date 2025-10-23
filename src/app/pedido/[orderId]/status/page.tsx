'use client'

import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useCart } from '@/contexts/CartContext'
import { useRouter } from 'next/navigation'
import { Layout } from '@/components/layout/Layout'
import { CheckCircle, Clock, XCircle, Loader2, Package } from 'lucide-react'
import { Order } from '@/types/order'

export default function OrderStatusPage({ params }: { params: { orderId: string } }) {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const { clearCart } = useCart()
  const router = useRouter()

  useEffect(() => {
    console.log('👀 Monitorando order:', params.orderId)

    // 🔥 TEMPO REAL: Escutar mudanças na order via Firebase
    const unsubscribe = onSnapshot(
      doc(db, 'orders', params.orderId),
      (docSnap) => {
        if (docSnap.exists()) {
          const orderData = { id: docSnap.id, ...docSnap.data() } as Order
          console.log('📦 Order atualizada:', orderData)
          setOrder(orderData)
          setLoading(false)

          // ✅ Se pagamento confirmado, limpar carrinho
          if (orderData.paymentStatus === 'CONFIRMED') {
            console.log('✅ Pagamento confirmado! Limpando carrinho...')
            clearCart()
            localStorage.removeItem('pendingOrderId')
          }
        } else {
          console.error('❌ Order não encontrada')
          setLoading(false)
        }
      },
      (error) => {
        console.error('❌ Erro ao monitorar order:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [params.orderId, clearCart])

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-coral-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Carregando pedido...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (!order) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Pedido não encontrado</h1>
            <p className="text-gray-600 mb-6">Não conseguimos encontrar este pedido.</p>
            <button
              onClick={() => router.push('/')}
              className="bg-coral-500 text-white px-6 py-3 rounded-lg hover:bg-coral-600 transition-colors"
            >
              Voltar para Home
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  const getStatusConfig = () => {
    const paymentStatus = order.paymentStatus || order.status

    switch (paymentStatus) {
      case 'PENDING_PAYMENT':
        return {
          icon: Clock,
          color: 'yellow',
          title: 'Aguardando Pagamento',
          description: 'Seu pedido está aguardando a confirmação do pagamento.',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-200'
        }
      case 'CONFIRMED':
        return {
          icon: CheckCircle,
          color: 'green',
          title: 'Pagamento Confirmado!',
          description: 'Seu pagamento foi confirmado com sucesso. O pedido está sendo preparado.',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-200'
        }
      case 'PARTIAL_STOCK':
        return {
          icon: Package,
          color: 'orange',
          title: 'Pagamento Confirmado - Atenção ao Estoque',
          description: 'Pagamento confirmado, mas alguns produtos não têm estoque. A empresa entrará em contato.',
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-800',
          borderColor: 'border-orange-200'
        }
      case 'CANCELLED':
        return {
          icon: XCircle,
          color: 'red',
          title: 'Pagamento Cancelado',
          description: 'O pagamento foi cancelado.',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-200'
        }
      default:
        return {
          icon: Clock,
          color: 'gray',
          title: 'Processando',
          description: 'Estamos processando seu pedido.',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200'
        }
    }
  }

  const statusConfig = getStatusConfig()
  const StatusIcon = statusConfig.icon

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="text-center mb-8">
              <div className={`mx-auto w-20 h-20 ${statusConfig.bgColor} rounded-full flex items-center justify-center mb-4`}>
                <StatusIcon className={`w-12 h-12 ${statusConfig.textColor}`} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {statusConfig.title}
              </h1>
              <p className="text-gray-600">
                {statusConfig.description}
              </p>
            </div>

            {/* Order Info */}
            <div className={`border ${statusConfig.borderColor} ${statusConfig.bgColor} rounded-lg p-6`}>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">Número do Pedido</p>
                  <p className="font-mono font-semibold text-gray-900">
                    #{order.id.slice(0, 8)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Status do Pagamento</p>
                  <p className={`font-semibold ${statusConfig.textColor}`}>
                    {order.paymentStatus || order.status}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Valor Total</p>
                  <p className="font-semibold text-gray-900">
                    R$ {order.totalAmount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Data</p>
                  <p className="font-semibold text-gray-900">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString('pt-BR') : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Produtos */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Produtos do Pedido</h2>
            <div className="space-y-4">
              {order.items?.map((item, index) => (
                <div key={index} className="flex items-center space-x-4 pb-4 border-b last:border-0">
                  <img
                    src={item.productImage || '/placeholder.png'}
                    alt={item.productName}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.productName}</h3>
                    <p className="text-sm text-gray-600">
                      Quantidade: {item.quantity} × R$ {item.unitPrice.toFixed(2)}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900">
                    R$ {item.totalPrice.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/perfil?tab=pedidos')}
              className="flex-1 bg-coral-500 text-white py-3 rounded-lg hover:bg-coral-600 transition-colors font-semibold"
            >
              Ver Todos os Pedidos
            </button>
            <button
              onClick={() => router.push('/')}
              className="flex-1 bg-white text-gray-700 border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
            >
              Continuar Comprando
            </button>
          </div>

          {/* Auto-refresh indicator */}
          {order.paymentStatus === 'PENDING_PAYMENT' && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center space-x-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Atualizando automaticamente...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

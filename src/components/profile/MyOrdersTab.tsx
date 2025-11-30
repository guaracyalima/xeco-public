'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { OrderService } from '@/services/orderService'
import { Order } from '@/types/order'
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  ChevronRight,
  Filter,
  Receipt
} from 'lucide-react'
import { useRouter } from 'next/navigation'

type OrderStatus = 'all' | 'pending' | 'paid' | 'confirmed' | 'cancelled'

const STATUS_CONFIG = {
  CREATED: { label: 'Criado', color: 'gray', icon: Clock },
  PENDING_PAYMENT: { label: 'Aguardando Pagamento', color: 'yellow', icon: Clock },
  PAID: { label: 'Pago', color: 'green', icon: CheckCircle },
  CONFIRMED: { label: 'Confirmado', color: 'green', icon: CheckCircle },
  PARTIAL_STOCK: { label: 'Estoque Parcial', color: 'orange', icon: AlertCircle },
  CANCELLED: { label: 'Cancelado', color: 'red', icon: XCircle },
  EXPIRED: { label: 'Expirado', color: 'gray', icon: XCircle },
}

const PAYMENT_STATUS_CONFIG = {
  PENDING: { label: 'Pendente', color: 'yellow' },
  PAID: { label: 'Pago', color: 'green' },
  CONFIRMED: { label: 'Confirmado', color: 'green' },
  CANCELLED: { label: 'Cancelado', color: 'red' },
  EXPIRED: { label: 'Expirado', color: 'gray' },
  PENDING_PAYMENT: { label: 'Aguardando', color: 'yellow' },
}

export function MyOrdersTab() {
  const { firebaseUser } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<OrderStatus>('all')

  useEffect(() => {
    console.log('🔄 [MyOrdersTab] useEffect - verificando firebaseUser...')
    console.log('👤 [MyOrdersTab] firebaseUser existe?', !!firebaseUser)
    console.log('👤 [MyOrdersTab] firebaseUser.uid:', firebaseUser?.uid)
    
    if (firebaseUser?.uid) {
      console.log('✅ [MyOrdersTab] firebaseUser OK, chamando loadOrders()')
      loadOrders()
    } else {
      console.log('⚠️ [MyOrdersTab] firebaseUser não está pronto ainda')
    }
  }, [firebaseUser])

  useEffect(() => {
    console.log('🔄 [MyOrdersTab] useEffect filterOrders - orders:', orders.length, 'statusFilter:', statusFilter)
    filterOrders()
  }, [orders, statusFilter])

  const loadOrders = async () => {
    try {
      console.log('🚀 [MyOrdersTab] Iniciando loadOrders...')
      console.log('👤 [MyOrdersTab] firebaseUser.uid:', firebaseUser!.uid)
      
      setLoading(true)
      
      const userOrders = await OrderService.getUserOrders(firebaseUser!.uid)
      
      console.log('📦 [MyOrdersTab] Pedidos carregados com sucesso!')
      console.log('📊 [MyOrdersTab] Quantidade:', userOrders.length)
      console.log('📋 [MyOrdersTab] Primeiros 3 pedidos:', userOrders.slice(0, 3).map(o => ({
        id: o.id,
        status: o.status,
        paymentStatus: o.paymentStatus,
        totalAmount: o.totalAmount,
        createdAt: o.createdAt
      })))
      
      setOrders(userOrders)
    } catch (error) {
      console.error('❌ [MyOrdersTab] Erro ao carregar pedidos:', error)
      console.error('❌ [MyOrdersTab] Tipo do erro:', (error as Error).name)
      console.error('❌ [MyOrdersTab] Mensagem:', (error as Error).message)
      console.error('❌ [MyOrdersTab] Stack:', (error as Error).stack)
    } finally {
      console.log('🏁 [MyOrdersTab] Finalizando loadOrders, setLoading(false)')
      setLoading(false)
    }
  }

  const filterOrders = () => {
    console.log('🔍 [filterOrders] Iniciando filtro...')
    console.log('📊 [filterOrders] Total de orders:', orders.length)
    console.log('🏷️ [filterOrders] Filtro ativo:', statusFilter)
    
    let filtered = [...orders]

    switch (statusFilter) {
      case 'pending':
        filtered = orders.filter(o => 
          o.status === 'CREATED' || 
          o.status === 'PENDING_PAYMENT' ||
          o.paymentStatus === 'PENDING'
        )
        console.log('🟡 [filterOrders] Filtrado PENDING:', filtered.length)
        break
      case 'paid':
        filtered = orders.filter(o => 
          o.paymentStatus === 'PAID' || 
          o.paymentStatus === 'CONFIRMED'
        )
        console.log('🟢 [filterOrders] Filtrado PAID:', filtered.length)
        break
      case 'confirmed':
        filtered = orders.filter(o => o.status === 'CONFIRMED')
        console.log('✅ [filterOrders] Filtrado CONFIRMED:', filtered.length)
        break
      case 'cancelled':
        filtered = orders.filter(o => 
          o.status === 'CANCELLED' || 
          o.status === 'EXPIRED'
        )
        console.log('🔴 [filterOrders] Filtrado CANCELLED:', filtered.length)
        break
      default:
        console.log('📋 [filterOrders] Mostrando TODOS:', filtered.length)
    }

    console.log('✅ [filterOrders] Resultado final:', filtered.length, 'pedidos')
    setFilteredOrders(filtered)
  }

  const getStatusBadge = (order: Order) => {
    const status = order.paymentStatus || order.status
    const config = PAYMENT_STATUS_CONFIG[status as keyof typeof PAYMENT_STATUS_CONFIG] || 
                   STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG]
    
    const colorClasses = {
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200',
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses[config?.color as keyof typeof colorClasses] || colorClasses.gray}`}>
        {config?.label || status}
      </span>
    )
  }

  const formatDate = (date: Date | string) => {
    console.log('📅 [formatDate] Input:', date, 'Tipo:', typeof date)
    
    try {
      const d = typeof date === 'string' ? new Date(date) : date
      console.log('📅 [formatDate] Date object:', d)
      
      const formatted = d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      
      console.log('📅 [formatDate] Resultado formatado:', formatted)
      return formatted
    } catch (error) {
      console.error('❌ [formatDate] Erro ao formatar data:', error)
      return 'Data inválida'
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const handleViewOrder = (orderId: string) => {
    console.log('🔗 [handleViewOrder] Navegando para pedido:', orderId)
    console.log('🔗 [handleViewOrder] URL:', `/order/${orderId}`)
    router.push(`/order/${orderId}`)
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Carregando seus pedidos...</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Meus Pedidos</h2>
        <p className="text-gray-600">Acompanhe o status de todas as suas compras</p>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === 'all'
              ? 'bg-coral-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Todos ({orders.length})
        </button>
        <button
          onClick={() => setStatusFilter('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === 'pending'
              ? 'bg-coral-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Pendentes
        </button>
        <button
          onClick={() => setStatusFilter('paid')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === 'paid'
              ? 'bg-coral-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Pagos
        </button>
        <button
          onClick={() => setStatusFilter('confirmed')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === 'confirmed'
              ? 'bg-coral-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Confirmados
        </button>
        <button
          onClick={() => setStatusFilter('cancelled')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === 'cancelled'
              ? 'bg-coral-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Cancelados
        </button>
      </div>

      {/* Lista de Pedidos */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {statusFilter === 'all' 
              ? 'Nenhum pedido encontrado'
              : 'Nenhum pedido nesta categoria'
            }
          </h3>
          <p className="text-gray-600">
            {statusFilter === 'all'
              ? 'Você ainda não fez nenhuma compra.'
              : 'Tente filtrar por outra categoria.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            console.log('🎨 [RENDER] Renderizando card do pedido:', order.id)
            console.log('🎨 [RENDER] Status:', order.status, 'PaymentStatus:', order.paymentStatus)
            console.log('🎨 [RENDER] Items:', order.items?.length || 0)
            console.log('🎨 [RENDER] CreatedAt:', order.createdAt)
            
            return (
              <div
                key={order.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  console.log('🖱️ [CLICK] Clicou no pedido:', order.id)
                  handleViewOrder(order.id)
                }}
              >
                {/* Header do Card */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900">
                      Pedido #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    {getStatusBadge(order)}
                  </div>
                  <p className="text-xs text-gray-500">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </div>

              {/* Produtos */}
              <div className="mb-3">
                <div className="flex items-start gap-3">
                  {order.items && order.items.length > 0 && (
                    <>
                      {order.items[0].productImage && (
                        <img
                          src={order.items[0].productImage}
                          alt={order.items[0].productName}
                          className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {order.items[0].productName}
                        </p>
                        <p className="text-xs text-gray-500">
                          Quantidade: {order.items[0].quantity}
                        </p>
                        {order.items.length > 1 && (
                          <p className="text-xs text-coral-600 mt-1">
                            + {order.items.length - 1} {order.items.length === 2 ? 'item' : 'itens'}
                          </p>
                        )}
                        {order.invoiceNumber && (
                          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                            <Receipt className="w-3 h-3" />
                            NF: {order.invoiceNumber}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="text-sm">
                  <span className="text-gray-600">Total: </span>
                  <span className="font-bold text-gray-900">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      console.log('🖱️ [CLICK] Botão Ver Detalhes:', order.id)
                      handleViewOrder(order.id)
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-coral-600 hover:text-coral-700 hover:bg-coral-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Ver Detalhes
                  </button>
                </div>
              </div>
            </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

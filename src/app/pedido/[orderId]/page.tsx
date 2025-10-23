'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Layout } from '@/components/layout/Layout'
import { OrderService } from '@/services/orderService'
import { Order } from '@/types/order'
import { useAuth } from '@/context/AuthContext'
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Receipt,
  Download,
  Printer
} from 'lucide-react'

const STATUS_TIMELINE = [
  { key: 'CREATED', label: 'Pedido Criado', icon: Package },
  { key: 'PENDING_PAYMENT', label: 'Aguardando Pagamento', icon: Clock },
  { key: 'PAID', label: 'Pagamento Confirmado', icon: CheckCircle },
  { key: 'CONFIRMED', label: 'Pedido Confirmado', icon: CheckCircle },
]

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { firebaseUser } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showInvoice, setShowInvoice] = useState(false)

  const orderId = params.orderId as string

  useEffect(() => {
    if (firebaseUser && orderId) {
      loadOrder()
    }
  }, [firebaseUser, orderId])

  const loadOrder = async () => {
    try {
      setLoading(true)
      const orderData = await OrderService.getOrder(orderId)
      
      if (!orderData) {
        setError('Pedido não encontrado')
        return
      }

      // Verificar se o pedido pertence ao usuário
      if (orderData.customerId !== firebaseUser?.uid) {
        setError('Você não tem permissão para visualizar este pedido')
        return
      }

      console.log('📦 [OrderDetail] Order carregada:', {
        id: orderData.id,
        status: orderData.status,
        paymentStatus: orderData.paymentStatus,
        invoiceUrl: orderData.invoiceUrl,
        invoiceNumber: orderData.invoiceNumber,
        hasInvoice: !!(orderData.invoiceUrl || orderData.invoiceNumber)
      })

      setOrder(orderData)
    } catch (err) {
      console.error('Erro ao carregar pedido:', err)
      setError('Erro ao carregar dados do pedido')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      CREATED: 'gray',
      PENDING_PAYMENT: 'yellow',
      PAID: 'green',
      CONFIRMED: 'green',
      CANCELLED: 'red',
      EXPIRED: 'gray',
    }
    return colors[status] || 'gray'
  }

  const getCurrentStatusIndex = () => {
    if (!order) return 0
    const status = order.paymentStatus || order.status
    return STATUS_TIMELINE.findIndex(s => s.key === status)
  }

  const handlePrintInvoice = () => {
    window.print()
  }

  const handleDownloadInvoice = () => {
    // TODO: Implementar geração de PDF
    alert('Funcionalidade de download em desenvolvimento')
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando pedido...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (error || !order) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {error || 'Pedido não encontrado'}
            </h2>
            <button
              onClick={() => router.push('/perfil?tab=pedidos')}
              className="mt-4 px-4 py-2 bg-coral-500 text-white rounded-lg hover:bg-coral-600"
            >
              Voltar para Meus Pedidos
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/perfil?tab=pedidos')}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar para Meus Pedidos
            </button>
            
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Pedido #{order.id.slice(0, 8).toUpperCase()}
                </h1>
                <p className="text-gray-600 mt-1">
                  Realizado em {formatDate(order.createdAt)}
                </p>
              </div>
              
              <button
                onClick={() => setShowInvoice(!showInvoice)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Receipt className="w-5 h-5" />
                {showInvoice ? 'Ocultar' : 'Ver'} Invoice
              </button>
            </div>
          </div>

          {/* Timeline de Status */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Status do Pedido
            </h2>
            
            <div className="relative">
              {STATUS_TIMELINE.map((step, index) => {
                const Icon = step.icon
                const currentIndex = getCurrentStatusIndex()
                const isCompleted = index <= currentIndex
                const isCurrent = index === currentIndex
                const isLast = index === STATUS_TIMELINE.length - 1

                return (
                  <div key={step.key} className="relative flex items-start mb-8 last:mb-0">
                    {/* Linha conectora */}
                    {!isLast && (
                      <div
                        className={`absolute left-6 top-12 w-0.5 h-16 ${
                          isCompleted ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      />
                    )}

                    {/* Ícone */}
                    <div
                      className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                        isCompleted
                          ? 'bg-green-500 border-green-500'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 ${
                          isCompleted ? 'text-white' : 'text-gray-400'
                        }`}
                      />
                    </div>

                    {/* Conteúdo */}
                    <div className="ml-4 flex-1">
                      <h3
                        className={`text-sm font-medium ${
                          isCurrent ? 'text-green-600' : 'text-gray-900'
                        }`}
                      >
                        {step.label}
                      </h3>
                      {isCurrent && (
                        <p className="text-xs text-gray-500 mt-1">
                          Status atual do pedido
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Produtos */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Itens do Pedido
            </h2>
            
            <div className="space-y-4">
              {order.items?.map((item, index) => (
                <div key={index} className="flex items-center gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  {item.productImage && (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.productName}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Quantidade: {item.quantity}
                    </p>
                    <p className="text-sm text-gray-600">
                      Preço unitário: {formatCurrency(item.unitPrice)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(item.totalPrice)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between text-lg font-bold">
                <span className="text-gray-900">Total do Pedido</span>
                <span className="text-coral-600">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Informações de Contato */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Informações de Contato
            </h2>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">{order.customerEmail}</span>
              </div>
              {order.customerPhone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">{order.customerPhone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Invoice do Asaas */}
          {(order.invoiceUrl || order.invoiceNumber) && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Nota Fiscal Asaas
              </h2>
              
              <div className="space-y-3">
                {order.invoiceNumber && (
                  <div className="flex items-center gap-3">
                    <Receipt className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Número da Nota</p>
                      <p className="font-medium text-gray-900">{order.invoiceNumber}</p>
                    </div>
                  </div>
                )}
                
                {order.invoiceUrl && (
                  <div className="flex items-center gap-3">
                    <a
                      href={order.invoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-coral-500 text-white rounded-lg hover:bg-coral-600 transition-colors"
                    >
                      <Receipt className="w-4 h-4" />
                      Visualizar Nota Fiscal Asaas
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Invoice Modal */}
          {showInvoice && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  {/* Header Invoice */}
                  <div className="flex items-start justify-between mb-6 pb-6 border-b">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">NOTA FISCAL</h2>
                      <p className="text-sm text-gray-600 mt-1">
                        Pedido #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      {order.invoiceNumber && (
                        <p className="text-xs text-gray-500 mt-1">
                          NF Asaas: {order.invoiceNumber}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setShowInvoice(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Link para Invoice Asaas */}
                  {order.invoiceUrl && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-blue-900 mb-1">
                            Nota Fiscal Eletrônica Asaas
                          </h3>
                          <p className="text-sm text-blue-700">
                            A nota fiscal oficial foi gerada pelo sistema Asaas
                          </p>
                        </div>
                        <a
                          href={order.invoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-4 inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                        >
                          <Receipt className="w-4 h-4" />
                          Abrir NF-e
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Dados do Pedido */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Dados do Cliente</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Nome</p>
                        <p className="font-medium">{order.customerName}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Email</p>
                        <p className="font-medium">{order.customerEmail}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Telefone</p>
                        <p className="font-medium">{order.customerPhone || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Data do Pedido</p>
                        <p className="font-medium">{formatDate(order.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Itens */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Itens</h3>
                    <table className="w-full text-sm">
                      <thead className="border-b">
                        <tr>
                          <th className="text-left py-2">Produto</th>
                          <th className="text-center py-2">Qtd</th>
                          <th className="text-right py-2">Preço Unit.</th>
                          <th className="text-right py-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items?.map((item, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-3">{item.productName}</td>
                            <td className="text-center py-3">{item.quantity}</td>
                            <td className="text-right py-3">{formatCurrency(item.unitPrice)}</td>
                            <td className="text-right py-3">{formatCurrency(item.totalPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="font-bold">
                          <td colSpan={3} className="text-right py-3">Total</td>
                          <td className="text-right py-3">{formatCurrency(order.totalAmount)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-3">
                    <button
                      onClick={handlePrintInvoice}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      <Printer className="w-4 h-4" />
                      Imprimir
                    </button>
                    <button
                      onClick={handleDownloadInvoice}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-coral-500 text-white rounded-lg hover:bg-coral-600"
                    >
                      <Download className="w-4 h-4" />
                      Baixar PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

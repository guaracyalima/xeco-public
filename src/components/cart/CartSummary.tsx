'use client'

import { useCart } from '@/contexts/CartContext'
import { MessageCircle, Package } from 'lucide-react'

export function CartSummary() {
  const { cart } = useCart()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  const handleProceedToWhatsApp = () => {
    if (cart.items.length === 0) return

    // Create WhatsApp message with cart items
    let message = `🛒 *Pedido via Xeco*\n\n`
    message += `📍 *Empresa:* ${cart.companyName}\n`
    message += `📦 *Itens do pedido:*\n\n`

    cart.items.forEach((item, index) => {
      message += `${index + 1}. *${item.product.name}*\n`
      message += `   Quantidade: ${item.quantity}\n`
      message += `   Preço unitário: ${formatPrice(item.product.salePrice)}\n`
      message += `   Subtotal: ${formatPrice(item.total)}\n\n`
    })

    message += `💰 *Total Geral: ${formatPrice(cart.totalPrice)}*\n\n`
    message += `📱 Mensagem enviada através da plataforma Xeco`

    // TODO: Get actual WhatsApp number from company data
    const whatsappNumber = '5511999999999' // This should come from company data
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    
    window.open(whatsappUrl, '_blank')
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-4">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Resumo do Pedido</h3>
      </div>

      {/* Summary Details */}
      <div className="px-6 py-4 space-y-4">
        {/* Items Count */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Itens ({cart.totalItems})</span>
          <span className="font-medium text-gray-900">{formatPrice(cart.totalPrice)}</span>
        </div>

        {/* Company Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Package className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-900">Fornecedor</span>
          </div>
          <p className="text-sm text-gray-600">{cart.companyName}</p>
          <p className="text-xs text-gray-500 mt-1">
            Todos os itens são da mesma empresa
          </p>
        </div>

        {/* Shipping Info */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Entrega</h4>
          <p className="text-sm text-gray-600 mb-3">
            As condições de entrega serão negociadas diretamente com a empresa via WhatsApp.
          </p>
          <div className="space-y-2 text-xs text-gray-500">
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Retirada no local
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Entrega local (consulte taxa)
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
              Envio via transportadora
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-gray-900">Total</span>
            <span className="text-lg font-bold text-coral-500">
              {formatPrice(cart.totalPrice)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Preço final a ser negociado com a empresa
          </p>
        </div>
      </div>

      {/* Action Button */}
      <div className="px-6 py-4 border-t border-gray-200">
        <button
          onClick={handleProceedToWhatsApp}
          disabled={cart.items.length === 0}
          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
        >
          <MessageCircle className="h-5 w-5" />
          <span>Finalizar via WhatsApp</span>
        </button>
        <p className="text-xs text-gray-500 text-center mt-2">
          Você será redirecionado para o WhatsApp da empresa
        </p>
      </div>

      {/* Security Info */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="text-center">
          <div className="text-xs text-gray-500 space-y-1">
            <p>🔒 Compra segura via Xeco</p>
            <p>✅ Empresa verificada</p>
            <p>📞 Suporte disponível</p>
          </div>
        </div>
      </div>
    </div>
  )
}
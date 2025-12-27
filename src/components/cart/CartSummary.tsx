'use client'

import { useState } from 'react'
import { useCart } from '@/contexts/CartContext'
import { MessageCircle, Package } from 'lucide-react'
import { CheckoutButton } from '@/components/checkout/CheckoutButton'
import { CouponField } from '@/components/cart/CouponField'
import { CartDiscount } from '@/types'

export function CartSummary() {
  const { cart } = useCart()
  const [discount, setDiscount] = useState<CartDiscount | null>(null)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  const finalTotal = discount ? discount.finalTotal : cart.totalPrice

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

        {/* Coupon Field */}
        <CouponField 
          companyId={cart.companyId || ''}
          cartTotal={cart.totalPrice}
          onCouponApplied={setDiscount}
          currentDiscount={discount}
        />

        {/* Discount Display */}
        {discount && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-900">{formatPrice(cart.totalPrice)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-600">Desconto ({discount.coupon.code})</span>
              <span className="text-green-600 font-medium">-{formatPrice(discount.discountAmount)}</span>
            </div>
          </div>
        )}

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
              {formatPrice(finalTotal)}
            </span>
          </div>
          {discount && (
            <p className="text-xs text-green-600 mt-1">
              Você economizou {formatPrice(discount.discountAmount)}!
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Preço final a ser negociado com a empresa
          </p>
        </div>
      </div>

      {/* Action Button */}
      <div className="px-6 py-4 border-t border-gray-200">
        <CheckoutButton discount={discount} />
      </div>
    </div>
  )
}
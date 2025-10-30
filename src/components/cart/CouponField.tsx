'use client'

import { useState } from 'react'
import { validateCoupon } from '@/lib/coupon-service'
import { CouponValidationResult, CartDiscount } from '@/types'
import { Tag, X, CheckCircle, AlertCircle, Percent, UserCheck } from 'lucide-react'

interface CouponFieldProps {
  companyId: string
  cartTotal: number
  onCouponApplied: (discount: CartDiscount | null) => void
  currentDiscount?: CartDiscount | null
}

export function CouponField({ 
  companyId, 
  cartTotal, 
  onCouponApplied, 
  currentDiscount 
}: CouponFieldProps) {
  const [couponCode, setCouponCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      alert('Digite um código de cupom para aplicar.')
      return
    }

    setIsLoading(true)

    try {
      const result: CouponValidationResult = await validateCoupon(
        couponCode.trim(),
        companyId,
        cartTotal
      )

      if (result.valid && result.coupon && result.discountAmount !== undefined) {
        // Success - apply discount
        const discount: CartDiscount = {
          coupon: result.coupon,
          affiliate: result.affiliate,
          discountAmount: result.discountAmount,
          originalTotal: cartTotal,
          finalTotal: cartTotal - result.discountAmount
        }

        onCouponApplied(discount)
        setCouponCode('')
        alert('✅ ' + result.message)
      } else {
        // Invalid coupon
        setCouponCode('')
        alert('❌ ' + result.message)
      }
    } catch (error) {
      setCouponCode('')
      alert('❌ Erro ao validar cupom. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveCoupon = () => {
    onCouponApplied(null)
    setCouponCode('')
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  return (
    <div className="space-y-4">
      {/* Coupon Input Field */}
      {!currentDiscount && (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Tag className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-900">Cupom de Desconto</span>
          </div>
          
          <div className="flex space-x-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Digite seu cupom"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-transparent text-sm"
              disabled={isLoading}
              onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
            />
            <button
              onClick={handleApplyCoupon}
              disabled={isLoading || !couponCode.trim()}
              className="px-4 py-2 bg-coral-500 text-white rounded-md hover:bg-coral-600 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Validando...' : 'Aplicar'}
            </button>
          </div>
          
          <p className="text-xs text-gray-500 mt-2">
            Digite o código do cupom da empresa ou de um afiliado
          </p>
        </div>
      )}

      {/* Applied Discount Display */}
      {currentDiscount && (
        <div className="border border-green-200 bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-900">Cupom Aplicado</span>
            </div>
            <button
              onClick={handleRemoveCoupon}
              className="text-red-600 hover:text-red-800 transition-colors"
              title="Remover cupom"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2">
            {/* Coupon Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <Tag className="h-3 w-3 text-green-600" />
                  <span className="text-sm font-mono font-bold text-green-800">
                    {currentDiscount.coupon.code}
                  </span>
                </div>
                {currentDiscount.coupon.type === 'AFFILIATE' && (
                  <div className="flex items-center space-x-1">
                    <UserCheck className="h-3 w-3 text-blue-600" />
                    <span className="text-xs text-blue-700">Afiliado</span>
                  </div>
                )}
              </div>
              <span className="text-sm font-bold text-green-700">
                -{formatPrice(currentDiscount.discountAmount)}
              </span>
            </div>

            {/* Affiliate Info */}
            {currentDiscount.affiliate && (
              <div className="bg-blue-50 border border-blue-200 rounded p-2">
                <div className="flex items-center space-x-2">
                  <UserCheck className="h-3 w-3 text-blue-600" />
                  <span className="text-xs text-blue-800">
                    Afiliado: {currentDiscount.affiliate.name}
                  </span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Código: {currentDiscount.affiliate.invite_code}
                </p>
              </div>
            )}

            {/* Discount Type */}
            <div className="flex items-center space-x-1">
              <Percent className="h-3 w-3 text-gray-500" />
              <span className="text-xs text-gray-600">
                {currentDiscount.coupon.discountType === 'percentage' 
                  ? `${currentDiscount.coupon.discountValue}% de desconto`
                  : `Desconto fixo de ${formatPrice(currentDiscount.coupon.discountValue || 0)}`
                }
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
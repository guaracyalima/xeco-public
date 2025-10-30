'use client'

import { useState } from 'react'
import { toast, ToastPosition } from 'react-toastify'
import { validateCoupon } from '@/lib/coupon-service'
import { CouponValidationResult, CartDiscount } from '@/types'
import { Tag, X, CheckCircle, AlertCircle, Percent, UserCheck } from 'lucide-react'

interface CouponFieldProps {
  companyId: string
  cartTotal: number
  onCouponApplied: (discount: CartDiscount | null) => void
  currentDiscount?: CartDiscount | null
}

// Helper para definir posição do toast baseado no tamanho da tela
const getToastPosition = (): ToastPosition => {
  if (typeof window !== 'undefined') {
    return window.innerWidth < 768 ? 'top-center' : 'top-right'
  }
  return 'top-right'
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
      toast.error('Digite um código de cupom para aplicar.', {
        position: getToastPosition(),
        autoClose: 3000,
      })
      return
    }

    setIsLoading(true)
    
    // Mostrar toast de loading
    const loadingToast = toast.loading('🔍 Validando cupom...', {
      position: getToastPosition(),
    })

    try {
      const result = await validateCoupon(
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
        
        toast.update(loadingToast, {
          render: `🎉 ${result.message}`,
          type: 'success',
          isLoading: false,
          autoClose: 4000,
          position: getToastPosition(),
        })
      } else {
        // Invalid coupon
        setCouponCode('')
        
        toast.update(loadingToast, {
          render: `❌ ${result.message}`,
          type: 'error',
          isLoading: false,
          autoClose: 5000,
          position: getToastPosition(),
        })
      }
    } catch (error) {
      setCouponCode('')
      
      toast.update(loadingToast, {
        render: '❌ Erro ao validar cupom. Tente novamente.',
        type: 'error',
        isLoading: false,
        autoClose: 5000,
        position: getToastPosition(),
      })
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
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 mt-2">
                <div className="flex items-start space-x-2">
                  <div className="p-1.5 bg-blue-500 rounded-full mt-0.5">
                    <UserCheck className="h-3 w-3 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      💙 Cupom de Parceiro
                    </p>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      Este cupom foi compartilhado por <span className="font-semibold">{currentDiscount.affiliate.name}</span>, 
                      um parceiro da loja. Ao usar este cupom, você apoia nosso parceiro! 🎉
                    </p>
                    <p className="text-xs text-blue-600 mt-2 font-mono bg-blue-100 px-2 py-1 rounded inline-block">
                      Código do Parceiro: {currentDiscount.affiliate.invite_code}
                    </p>
                  </div>
                </div>
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
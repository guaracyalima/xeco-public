'use client'

import { useState } from 'react'
import { toast } from 'react-toastify'
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
      toast.error('Digite um código de cupom para aplicar.', {
        position: 'top-center',
        autoClose: 3000,
      })
      return
    }

    setIsLoading(true)

    const validatePromise = validateCoupon(
      couponCode.trim(),
      companyId,
      cartTotal
    )

    toast.promise(
      validatePromise,
      {
        pending: {
          render: '🔍 Validando cupom...',
          position: 'top-center',
        },
        success: {
          render: ({ data }: { data: CouponValidationResult }) => {
            if (data.valid && data.coupon && data.discountAmount !== undefined) {
              // Success - apply discount
              const discount: CartDiscount = {
                coupon: data.coupon,
                affiliate: data.affiliate,
                discountAmount: data.discountAmount,
                originalTotal: cartTotal,
                finalTotal: cartTotal - data.discountAmount
              }

              onCouponApplied(discount)
              setCouponCode('')
              setIsLoading(false)
              
              return `🎉 ${data.message}`
            } else {
              // Invalid coupon
              setCouponCode('')
              setIsLoading(false)
              throw new Error(data.message)
            }
          },
          position: 'top-center',
          autoClose: 4000,
        },
        error: {
          render: ({ data }: any) => {
            setCouponCode('')
            setIsLoading(false)
            return `❌ ${data?.message || 'Erro ao validar cupom. Tente novamente.'}`
          },
          position: 'top-center',
          autoClose: 5000,
        }
      }
    )
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
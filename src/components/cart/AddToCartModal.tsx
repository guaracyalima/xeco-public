'use client'

import { useEffect } from 'react'
import { ShoppingCart, X, ArrowRight, ShoppingBag } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Product } from '@/types'

interface AddToCartModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
}

export function AddToCartModal({ isOpen, onClose, product }: AddToCartModalProps) {
  const router = useRouter()

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const handleGoToCart = () => {
    onClose()
    router.push('/carrinho')
  }

  const handleContinueShopping = () => {
    onClose()
  }

  if (!isOpen || !product) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all animate-in zoom-in-95 duration-300">
          {/* Header */}
          <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 px-6 pt-6 pb-8">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Fechar"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Success icon animation */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>
                <div className="relative bg-green-500 rounded-full p-4">
                  <ShoppingCart className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">
              Produto adicionado! 🎉
            </h3>

            <p className="text-gray-600 text-sm text-center">
              O que você deseja fazer agora?
            </p>
          </div>

          {/* Product Info */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              {product.imagesUrl && product.imagesUrl[0] && (
                <img
                  src={product.imagesUrl[0]}
                  alt={product.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
              )}
              <div className="flex-1 text-left">
                <h4 className="font-semibold text-gray-900 text-sm line-clamp-1">
                  {product.name}
                </h4>
                <p className="text-coral-600 font-bold text-lg">
                  R$ {product.salePrice.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-6 py-6 space-y-3">
            {/* Primary Action - Go to Cart */}
            <button
              onClick={handleGoToCart}
              className="w-full bg-coral-500 text-white py-4 rounded-xl font-semibold hover:bg-coral-600 transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2 shadow-lg shadow-coral-500/30"
            >
              <ShoppingBag className="h-5 w-5" />
              <span>Finalizar Compra</span>
              <ArrowRight className="h-5 w-5" />
            </button>

            {/* Secondary Action - Continue Shopping */}
            <button
              onClick={handleContinueShopping}
              className="w-full bg-white border-2 border-gray-300 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              Continuar Comprando
            </button>
          </div>

          {/* Footer tip */}
          <div className="px-6 pb-6 pt-2">
            <p className="text-xs text-gray-500 text-center">
              💡 Você pode adicionar mais produtos antes de finalizar
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

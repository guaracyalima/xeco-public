'use client'

import { useState, useEffect } from 'react'
import { Product } from '@/types'
import { ShoppingCart, Check, Minus, Plus } from 'lucide-react'
import { useCartOperations } from '@/hooks/useCartOperations'
import { CompanyConflictModal } from '@/components/cart/CompanyConflictModal'
import { SuccessToast } from '@/components/ui/SuccessToast'

interface AddToCartButtonProps {
  product: Product
  initialQuantity?: number
  showQuantitySelector?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary'
  className?: string
}

export function AddToCartButton({
  product,
  initialQuantity = 1,
  showQuantitySelector = true,
  size = 'md',
  variant = 'primary',
  className = ''
}: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(initialQuantity)
  const [showConflictModal, setShowConflictModal] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  
  const {
    cart,
    addProductToCart,
    clearCartCompletely,
    isProductInCart,
    getProductQuantityInCart,
    canAddProduct
  } = useCartOperations()

  const currentQuantityInCart = getProductQuantityInCart(product.id)
  const isInCart = isProductInCart(product.id)

  const handleAddToCart = async () => {
    if (product.stockQuantity === 0) return

    setIsAdding(true)
    const result = await addProductToCart(product, quantity)
    
    if (result.needsConfirmation) {
      setShowConflictModal(true)
    } else if (result.success) {
      setShowSuccessToast(true)
      setQuantity(1) // Reset quantity
    }
    
    setIsAdding(false)
  }

  const handleClearAndAdd = async () => {
    clearCartCompletely()
    const result = await addProductToCart(product, quantity)
    
    if (result.success) {
      setShowSuccessToast(true)
      setQuantity(1)
    }
    
    setShowConflictModal(false)
  }

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return
    if (newQuantity > product.stockQuantity) return
    setQuantity(newQuantity)
  }

  // Auto-hide success toast
  useEffect(() => {
    if (showSuccessToast) {
      const timer = setTimeout(() => {
        setShowSuccessToast(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showSuccessToast])

  // Size classes
  const sizeClasses = {
    sm: 'py-2 px-4 text-sm',
    md: 'py-3 px-6 text-base',
    lg: 'py-4 px-8 text-lg'
  }

  // Variant classes
  const variantClasses = {
    primary: 'bg-coral-500 hover:bg-coral-600 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300'
  }

  const isDisabled = product.stockQuantity === 0 || isAdding

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Quantity Selector */}
      {showQuantitySelector && (
        <div className="flex items-center space-x-3">
          <label className="text-sm font-medium text-gray-700">
            Quantidade:
          </label>
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1}
              className="p-2 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Minus className="h-4 w-4" />
            </button>
            <input
              type="number"
              min="1"
              max={product.stockQuantity}
              value={quantity}
              onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
              className="w-16 px-3 py-2 text-center border-x border-gray-300 focus:outline-none"
            />
            <button
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={quantity >= product.stockQuantity}
              className="p-2 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={isDisabled}
        className={`
          w-full font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2
          disabled:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-500
          ${sizeClasses[size]}
          ${variantClasses[variant]}
        `}
      >
        {isAdding ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            <span>Adicionando...</span>
          </>
        ) : isInCart ? (
          <>
            <Check className="h-5 w-5" />
            <span>Adicionar mais ({currentQuantityInCart} no carrinho)</span>
          </>
        ) : (
          <>
            <ShoppingCart className="h-5 w-5" />
            <span>
              {product.stockQuantity === 0 ? 'Indisponível' : 'Adicionar ao carrinho'}
            </span>
          </>
        )}
      </button>

      {/* Stock info */}
      <div className="text-sm text-gray-500">
        {product.stockQuantity > 0 ? (
          <span>{product.stockQuantity} unidades disponíveis</span>
        ) : (
          <span className="text-red-500">Produto esgotado</span>
        )}
      </div>

      {/* Company Conflict Modal */}
      <CompanyConflictModal
        isOpen={showConflictModal}
        onClose={() => setShowConflictModal(false)}
        onClearAndAdd={handleClearAndAdd}
        currentCompanyName={cart.companyName}
        newProductCompanyName={product.companyOwnerName || null}
        newProduct={product}
      />

      {/* Success Toast */}
      <SuccessToast
        isVisible={showSuccessToast}
        message={`${product.name} adicionado ao carrinho!`}
        onClose={() => setShowSuccessToast(false)}
      />
    </div>
  )
}
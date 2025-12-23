'use client'

import { useState, useEffect } from 'react'
import { Product } from '@/types'
import { MapPin, Building2, Package, Heart, Share2, MessageCircle, ShoppingCart } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { CompanyConflictModal } from '@/components/cart/CompanyConflictModal'
import { SuccessToast } from '@/components/ui/SuccessToast'
import { FavoriteCompanyButton } from '@/components/favorites/FavoriteCompanyButton'
import { useProductAnalytics, useCompanyAnalytics } from '@/hooks/useAnalytics'
import Link from 'next/link'

interface ProductInfoProps {
  product: Product
}

export function ProductInfo({ product }: ProductInfoProps) {
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [showConflictModal, setShowConflictModal] = useState(false)
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null)
  const [pendingQuantity, setPendingQuantity] = useState(1)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const { cart, addToCart, clearCart } = useCart()
  const { trackAddToCart, trackProductView, trackProductShare } = useProductAnalytics()
  const { trackCompanyContact } = useCompanyAnalytics()

  useEffect(() => {
    trackProductView(product, {
      location: 'product_page',
      source: 'direct_link'
    })
  }, [product, trackProductView])

  const handleAddToCart = async () => {
    console.log('🛒 Tentando adicionar ao carrinho:', { produto: product.name, quantidade: quantity })
    const success = await addToCart(product, quantity)
    
    if (!success) {
      console.log('❌ Conflito de franquia detectado')
      // Show conflict modal
      setPendingProduct(product)
      setPendingQuantity(quantity)
      setShowConflictModal(true)
    } else {
      console.log('✅ Produto adicionado ao carrinho com sucesso!')
      console.log('📊 Estado do carrinho após adição:', cart)
      
      // Track successful add to cart
      trackAddToCart(product, quantity)
      
      // Success - show success toast
      setShowSuccessToast(true)
      // Reset quantity to 1 after adding
      setQuantity(1)
    }
  }

  const handleClearAndAdd = async () => {
    if (pendingProduct) {
      await clearCart()
      await addToCart(pendingProduct, pendingQuantity)
      
      // Track successful add to cart after clearing
      trackAddToCart(pendingProduct, pendingQuantity)
      
      setShowConflictModal(false)
      setPendingProduct(null)
      setPendingQuantity(1)
      setShowSuccessToast(true)
      // Reset quantity to 1 after adding
      setQuantity(1)
    }
  }

  const handleCloseModal = () => {
    setShowConflictModal(false)
    setPendingProduct(null)
    setPendingQuantity(1)
  }

  // Auto-hide success toast after 3 seconds
  useEffect(() => {
    if (showSuccessToast) {
      const timer = setTimeout(() => {
        setShowSuccessToast(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showSuccessToast])

  const handleWhatsAppContact = () => {
    // Track WhatsApp contact
    trackCompanyContact({ id: product.companyOwner, name: product.companyOwnerName }, 'whatsapp')
    
    // Buscar franquia para obter WhatsApp
    const message = `Olá! Tenho interesse no produto: ${product.name}`
    const whatsappUrl = `https://wa.me/5511999999999?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description || 'Confira este produto no Xuxum!',
          url: window.location.href,
        })
        // Track successful native share
        trackProductShare(product, 'native')
      } catch (err) {
        console.log('Erro ao compartilhar:', err)
      }
    } else {
      // Fallback: copiar URL
      navigator.clipboard.writeText(window.location.href)
      // Track copy share
      trackProductShare(product, 'copy')
      alert('Link copiado para a área de transferência!')
    }
  }

  return (
    <div className="space-y-6">
      {/* Product Name */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 leading-tight">
          {product.name}
        </h1>
        {product.companyOwnerName && (
          <div className="flex items-center mt-2 text-gray-600">
            <Building2 className="h-4 w-4 mr-1" />
            <span className="text-sm">{product.companyOwnerName}</span>
          </div>
        )}
      </div>

      {/* Location */}
      <div className="flex items-center text-gray-600">
        <MapPin className="h-4 w-4 mr-2" />
        <span className="text-sm">{product.cidade}, {product.uf}</span>
      </div>

      {/* Price */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center space-x-3">
          <span className="text-3xl font-bold text-coral-500">
            R$ {product.salePrice.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </span>
        </div>
      </div>

      {/* Stock */}
      <div className="flex items-center text-sm text-gray-600">
        <Package className="h-4 w-4 mr-2" />
        <span>
          {product.stockQuantity > 0 
            ? `${product.stockQuantity} unidades disponíveis`
            : 'Consulte disponibilidade'
          }
        </span>
      </div>

      {/* Description */}
      {product.description && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Descrição</h3>
          <p className="text-gray-600 leading-relaxed">{product.description}</p>
        </div>
      )}

      {/* Add to Cart Component */}
      <div className="space-y-4">
        {/* Quantity Selector */}
        <div className="flex items-center space-x-3">
          <label htmlFor="quantity" className="text-sm font-medium text-gray-700">
            Quantidade:
          </label>
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-3 py-2 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              -
            </button>
            <input
              id="quantity"
              type="number"
              min="1"
              max={product.stockQuantity}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 px-3 py-2 text-center border-x border-gray-300 focus:outline-none"
            />
            <button
              onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
              className="px-3 py-2 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={() => { console.log('Botão Comprar agora clicado'); handleAddToCart(); }}
          disabled={false}
          className="comprar-agora-btn w-full text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 shadow-lg z-50"
        >
          <ShoppingCart className="h-5 w-5" />
          <span>
            Comprar agora
          </span>
        </button>
        
        <style jsx>{`
          .comprar-agora-btn {
            background: var(--primary);
            border: 2px solid var(--primary);
          }
          
          .comprar-agora-btn:hover:not(:disabled) {
            background: var(--primary-hover);
            border-color: var(--primary-hover);
          }
          
          .comprar-agora-btn:disabled {
            background: #ccc;
            border-color: #ccc;
            cursor: not-allowed;
            opacity: 0.6;
          }
        `}</style>
      </div>

      {/* Secondary Actions */}
      <div className="flex space-x-3">
        <button
          onClick={() => setIsWishlisted(!isWishlisted)}
          className={`flex-1 border py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
            isWishlisted 
              ? 'border-coral-500 text-coral-500 bg-coral-50' 
              : 'border-gray-300 text-gray-700 hover:border-gray-400'
          }`}
        >
          <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
          <span>Favoritar produto</span>
        </button>

        <button
          onClick={handleShare}
          className="flex-1 border border-gray-300 text-gray-700 hover:border-gray-400 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
        >
          <Share2 className="h-4 w-4" />
          <span>Compartilhar</span>
        </button>
      </div>

      {/* Company Favorite */}
      {product.companyOwner && product.companyOwnerName && (
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-gray-600" />
              <Link 
                href={`/company/${product.companyOwner}`}
                className="text-lg font-semibold text-gray-900 hover:text-coral-600 transition-colors"
              >
                {product.companyOwnerName}
              </Link>
            </div>
          </div>
          
          <div className="flex gap-3">
            <FavoriteCompanyButton
              companyId={product.companyOwner}
              companyName={product.companyOwnerName}
              className="flex-1"
            />
            <Link
              href={`/company/${product.companyOwner}`}
              className="flex-1 border border-coral-500 text-coral-600 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 hover:bg-coral-50"
            >
              <Building2 className="h-4 w-4" />
              <span>Ver Franquia</span>
            </Link>
          </div>
        </div>
      )}

      {/* Product Meta */}
      <div className="pt-6 border-t border-gray-200">
        <dl className="grid grid-cols-1 gap-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-600">Franquia:</dt>
            <dd className="text-gray-900 font-medium">{product.companyOwnerName}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">Localização:</dt>
            <dd className="text-gray-900">{product.cidade}, {product.uf}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">Status:</dt>
            <dd className="text-green-600 font-medium">Disponível</dd>
          </div>
        </dl>
      </div>

      {/* Company Conflict Modal */}
      <CompanyConflictModal
        isOpen={showConflictModal}
        onClose={handleCloseModal}
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
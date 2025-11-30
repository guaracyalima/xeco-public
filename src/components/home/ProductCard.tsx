'use client'

import { useState } from 'react'
import { Product } from '@/types'
import { MapPin, Package, Heart, ShoppingCart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useProductAnalytics } from '@/hooks/useAnalytics'
import { useLikedProductContext } from '@/contexts/LikedProductContext'
import { useCart } from '@/contexts/CartContext'
import { CompanyConflictModal } from '@/components/cart/CompanyConflictModal'

interface ProductCardProps {
  product: Product
  showBadge?: string
}

export function ProductCard({ product, showBadge }: ProductCardProps) {
  const router = useRouter()
  const { trackProductView, trackProductClick } = useProductAnalytics()
  const { favoriteProduct, unfavoriteProduct, isFavored } = useLikedProductContext()
  const { cart, addToCart, clearCart } = useCart()
  const [showConflictModal, setShowConflictModal] = useState(false)
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null)

  const handleClick = () => {
    trackProductClick(product.id, product.name, {
      price: product.salePrice,
      companyId: product.companyOwner,
      location: 'product_card',
      source: 'featured_products'
    })
    router.push(`/product/${product.id}`)
  }

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation() // Evita navegar ao clicar no botão
    
    try {
      if (isFavored(product.id)) {
        await unfavoriteProduct(product.id)
      } else {
        await favoriteProduct(product.id, product.companyOwner)
      }
    } catch (error) {
      console.error('Erro ao favoritar produto:', error)
    }
  }

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation() // Evita navegar ao clicar no botão
    
    const success = await addToCart(product, 1)
    
    if (!success) {
      // Show conflict modal
      setPendingProduct(product)
      setShowConflictModal(true)
    }
    // Se success, o modal já será exibido pelo CartContext
  }

  const handleClearAndAdd = async () => {
    if (pendingProduct) {
      await clearCart()
      await addToCart(pendingProduct, 1)
      setShowConflictModal(false)
      setPendingProduct(null)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  const getStockStatus = () => {
    if (product.stockQuantity === 0) return 'Esgotado'
    if (product.stockQuantity <= 5) return 'Últimas unidades'
    return `${product.stockQuantity} disponíveis`
  }

  const getStockColor = () => {
    if (product.stockQuantity === 0) return 'text-red-500'
    if (product.stockQuantity <= 5) return 'text-orange-500'
    return 'text-green-600'
  }

  return (
    <div onClick={handleClick} className="product-card group cursor-pointer">
      {/* Product Image */}
      <div className="product-image">
        {product.imagesUrl && product.imagesUrl.length > 0 ? (
          <img 
            src={product.imagesUrl[0]} 
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              ;(e.target as HTMLImageElement).src = '/default-fail-image.jpg'
            }}
          />
        ) : (
          <img 
            src="/default-fail-image.jpg"
            alt={product.name}
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Badge */}
        {showBadge && (
          <div className="product-badge">
            {showBadge}
          </div>
        )}

        {/* Quick view overlay */}
        <div className="product-overlay">
          <button className="quick-view-btn">
            Ver Detalhes
          </button>
          <button
            onClick={handleFavoriteClick}
            className="favorite-btn"
            title={isFavored(product.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          >
            <Heart
              className={`w-6 h-6 ${isFavored(product.id) ? 'text-coral-700' : 'text-white'}`}
              fill={isFavored(product.id) ? "currentColor" : "none"}
            />
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="product-content">
        <h3 className="product-title">{product.name}</h3>
        
        <div className="product-price">
          {formatPrice(product.salePrice)}
        </div>

        <div className="product-location">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span>{product.cidade}, {product.uf}</span>
        </div>

        {/* Descrição do produto */}
        {product.description && (
          <p className="product-description">
            {product.description.length > 80 
              ? `${product.description.substring(0, 80)}...` 
              : product.description
            }
          </p>
        )}

        {/* Company info */}
        <div className="product-company">
          <span className="text-xs text-gray-500">Vendido por:</span>
          <span className="text-sm font-medium text-gray-700">
            {product.companyOwnerName || product.companyOwner}
          </span>
        </div>

        {/* Add to cart button */}
        <button
          onClick={handleAddToCart}
          className="add-to-cart-btn"
          disabled={product.stockQuantity === 0}
        >
          <ShoppingCart className="w-4 h-4" />
          {product.stockQuantity === 0 ? 'Esgotado' : 'Adicionar ao Carrinho'}
        </button>
      </div>

      {/* Company Conflict Modal */}
      {pendingProduct && (
        <CompanyConflictModal
          isOpen={showConflictModal}
          onClose={() => setShowConflictModal(false)}
          currentCompanyName={cart.companyName || ''}
          newProductCompanyName={pendingProduct.companyOwnerName || ''}
          newProduct={pendingProduct}
          onClearAndAdd={handleClearAndAdd}
        />
      )}

      <style jsx>{`
        .product-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          transition: all 0.3s ease;
          border: 1px solid #f0f0f0;
        }

        .product-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          border-color: var(--primary);
        }

        .product-image {
          height: 200px;
          position: relative;
          overflow: hidden;
        }

        .product-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: var(--primary);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .emphasis-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: linear-gradient(135deg, #ffba00, #ff9800);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(255, 186, 0, 0.3);
        }

        .product-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .group:hover .product-overlay {
          opacity: 1;
        }

        .quick-view-btn {
          background: white;
          color: #333;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .quick-view-btn:hover {
          background: var(--primary);
          color: white;
        }

        .favorite-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(255, 255, 255, 0.9);
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          z-index: 10;
        }

        .favorite-btn:hover {
          background: white;
          transform: scale(1.1);
        }

        .product-content {
          padding: 16px;
        }

        .product-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #333;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .product-price {
          font-size: 18px;
          font-weight: 700;
          color: var(--primary);
          margin-bottom: 8px;
        }

        .product-location {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
          color: #666;
          margin-bottom: 8px;
        }

        .product-description {
          font-size: 13px;
          color: #666;
          line-height: 1.4;
          margin-bottom: 8px;
        }

        .product-company {
          padding-top: 8px;
          border-top: 1px solid #f0f0f0;
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-bottom: 12px;
        }

        .add-to-cart-btn {
          width: 100%;
          background: var(--primary);
          color: white;
          border: none;
          padding: 12px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.3s ease;
        }

        .add-to-cart-btn:hover:not(:disabled) {
          background: var(--primary-hover);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.3);
        }

        .add-to-cart-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
          opacity: 0.6;
        }

        @media (max-width: 640px) {
          .product-image {
            height: 160px;
          }
          
          .product-content {
            padding: 12px;
          }
          
          .product-title {
            font-size: 14px;
          }
          
          .product-price {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { Product } from '@/types'
import { MapPin, Package, ShoppingCart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'
import { CompanyConflictModal } from '@/components/cart/CompanyConflictModal'
import { SuccessToast } from '@/components/ui/SuccessToast'

interface CompanyProductCardProps {
  product: Product
  showBadge?: string
}

export function CompanyProductCard({ product, showBadge }: CompanyProductCardProps) {
  const router = useRouter()
  const { cart, addToCart, clearCart } = useCart()
  const [showConflictModal, setShowConflictModal] = useState(false)
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null)
  const [showSuccessToast, setShowSuccessToast] = useState(false)

  const handleViewDetails = () => {
    router.push(`/product/${product.id}`)
  }

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    const success = await addToCart(product, 1)
    
    if (!success) {
      // Show conflict modal
      setPendingProduct(product)
      setShowConflictModal(true)
    } else {
      // Success - show success toast
      setShowSuccessToast(true)
    }
  }

  const handleClearAndAdd = async () => {
    if (pendingProduct) {
      await clearCart()
      await addToCart(pendingProduct, 1)
      setShowConflictModal(false)
      setPendingProduct(null)
      setShowSuccessToast(true)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  return (
    <>
      <div onClick={handleViewDetails} className="product-card group cursor-pointer">
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

          {/* Stock info */}
          <div className="product-stock">
            <span className="text-xs text-gray-500">
              {product.stockQuantity} unidades disponíveis
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

          .product-stock {
            margin-bottom: 12px;
          }

          .add-to-cart-btn {
            width: 100%;
            background: var(--primary);
            color: white;
            border: none;
            padding: 10px 16px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }

          .add-to-cart-btn:hover:not(:disabled) {
            background: #e54d52;
            transform: translateY(-1px);
          }

          .add-to-cart-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
            transform: none;
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

      {/* Modals */}
      {showConflictModal && pendingProduct && (
        <CompanyConflictModal
          isOpen={showConflictModal}
          onClose={() => {
            setShowConflictModal(false)
            setPendingProduct(null)
          }}
          onClearAndAdd={handleClearAndAdd}
          currentCompanyName={cart.items[0]?.product.companyOwnerName || null}
          newProductCompanyName={pendingProduct.companyOwnerName || null}
          newProduct={pendingProduct}
        />
      )}

      {showSuccessToast && (
        <SuccessToast
          message="Produto adicionado ao carrinho!"
          isVisible={showSuccessToast}
          onClose={() => setShowSuccessToast(false)}
        />
      )}
    </>
  )
}
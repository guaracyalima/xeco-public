'use client'

import { Product } from '@/types'
import { MapPin, Package } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ProductCardProps {
  product: Product
  showBadge?: string
}

export function ProductCard({ product, showBadge }: ProductCardProps) {
  const router = useRouter()

  const handleClick = () => {
    router.push(`/produto/${product.id}`)
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
          />
        ) : (
          <div className="bg-gray-200 w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-400" />
          </div>
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

        {/* Company info */}
        <div className="product-company">
          <span className="text-xs text-gray-500">Vendido por:</span>
          <span className="text-sm font-medium text-gray-700">
            {product.companyOwnerName || product.companyOwner}
          </span>
        </div>
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
          border-color: #ff5a5f;
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
          background: #ff5a5f;
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
          background: #ff5a5f;
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
          color: #ff5a5f;
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
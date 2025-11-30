'use client'

import { useLikedProductContext } from '@/contexts/LikedProductContext'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MapPin, Package, Heart, Building2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getCompanyById } from '@/lib/firebase-service'

interface CompanyData {
  id: string
  name: string
  logo?: string
}

export function InterestedProductsTab() {
  const { favoredProducts, loading, error, unfavoriteProduct, isFavored } = useLikedProductContext()
  const router = useRouter()
  const [companyCache, setCompanyCache] = useState<Record<string, CompanyData>>({})

  const handleProductClick = (productId: string) => {
    router.push(`/product/${productId}`)
  }

  const handleFavoriteClick = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation()
    try {
      await unfavoriteProduct(productId)
    } catch (error) {
      console.error('Erro ao remover:', error)
    }
  }

  // Fetch company logo when products are loaded
  useEffect(() => {
    const loadCompanyLogos = async () => {
      const newCache = { ...companyCache }
      
      for (const product of favoredProducts) {
        if (product.companyOwner && !newCache[product.companyOwner]) {
          try {
            const company = await getCompanyById(product.companyOwner)
            if (company) {
              newCache[product.companyOwner] = {
                id: company.id,
                name: company.name,
                logo: company.logo
              }
            }
          } catch (err) {
            console.error(`Erro ao buscar empresa ${product.companyOwner}:`, err)
          }
        }
      }
      
      setCompanyCache(newCache)
    }
    
    if (favoredProducts.length > 0) {
      loadCompanyLogos()
    }
  }, [favoredProducts])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500"></div>
          <p className="mt-3 text-gray-600">Carregando produtos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    )
  }

  if (favoredProducts.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-4xl mb-3">❤️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Nenhum produto favoritado
          </h3>
          <p className="text-gray-600 mb-4">
            Adicione produtos aos favoritos para acompanhá-los aqui!
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-2 bg-coral-500 hover:bg-coral-600 text-white font-semibold rounded-lg transition-colors"
          >
            Explorar Produtos
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {favoredProducts.map(product => (
          <div
            key={product.id}
            onClick={() => handleProductClick(product.id)}
            className="product-card group cursor-pointer"
          >
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

              {/* Quick view overlay */}
              <div className="product-overlay">
                <button className="quick-view-btn">
                  Ver Detalhes
                </button>
                <button
                  onClick={(e) => handleFavoriteClick(e, product.id)}
                  className="favorite-btn"
                  title="Remover dos favoritos"
                >
                  <Heart
                    className="w-6 h-6 text-coral-700"
                    fill="currentColor"
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
                <div className="flex items-center gap-2">
                  {companyCache[product.companyOwner]?.logo ? (
                    <img
                      src={companyCache[product.companyOwner].logo}
                      alt={companyCache[product.companyOwner].name}
                      className="w-5 h-5 object-cover rounded"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src = '/default-fail-image.jpg'
                      }}
                    />
                  ) : (
                    <img
                      src="/default-fail-image.jpg"
                      alt="default"
                      className="w-5 h-5 object-cover rounded"
                    />
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {companyCache[product.companyOwner]?.name || product.companyOwnerName || product.companyOwner}
                  </span>
                </div>
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
                border-color: var(--primary);
              }

              .product-image {
                height: 200px;
                position: relative;
                overflow: hidden;
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
                gap: 2rem;
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
                position: relative;
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
              }
            `}</style>
          </div>
        ))}
      </div>
    </div>
  )
}

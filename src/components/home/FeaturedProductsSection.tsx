'use client'

import { Product } from '@/types'
import { ProductCard } from './ProductCard'
import { ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useNavigationAnalytics } from '@/hooks/useAnalytics'

interface FeaturedProductsSectionProps {
  products: Product[]
  title?: string
}

export function FeaturedProductsSection({ 
  products, 
  title = "Super ofertas🔥" 
}: FeaturedProductsSectionProps) {
  const router = useRouter()
  const { trackButtonClick } = useNavigationAnalytics()

  const handleViewAll = () => {
    trackButtonClick('view_all_featured_products', `featured_products_section_${title}`)
    router.push('/products')
  }

  return (
    <section className="featured-products-section">
      <div className="container mx-auto px-4">
        <div className="section-header">
          <div className="header-content">
            <h2 className="section-title">{title}</h2>
            <p className="section-subtitle">
              Descubra os produtos mais procurados da sua região
            </p>
          </div>
          
          <button onClick={handleViewAll} className="view-all-btn">
            <span>Ver todos</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {products.length > 0 ? (
          <div className="products-grid">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                showBadge="Destaque"
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-content">
              <div className="empty-icon">
                📦
              </div>
              <h3 className="empty-title">Nenhum produto em destaque</h3>
              <p className="empty-description">
                Ainda não há produtos em destaque cadastrados.
              </p>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .featured-products-section {
          padding: 80px 0;
          background: white;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 40px;
          gap: 20px;
        }

        .header-content {
          flex: 1;
        }

        .section-title {
          font-size: 32px;
          font-weight: 700;
          color: #333;
          margin: 0 0 8px 0;
        }

        .section-subtitle {
          font-size: 16px;
          color: #666;
          margin: 0;
        }

        .view-all-btn {
          background: var(--primary);
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 6px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 14px;
        }

        .view-all-btn:hover {
          background: var(--primary-hover);
          transform: translateY(-1px);
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
        }

        .empty-state {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 300px;
        }

        .empty-content {
          text-align: center;
          max-width: 400px;
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .empty-title {
          font-size: 20px;
          font-weight: 600;
          color: #333;
          margin: 0 0 8px 0;
        }

        .empty-description {
          font-size: 16px;
          color: #666;
          margin: 0;
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .featured-products-section {
            padding: 40px 0;
          }

          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }

          .section-title {
            font-size: 24px;
          }

          .section-subtitle {
            font-size: 14px;
          }

          .view-all-btn {
            align-self: stretch;
            justify-content: center;
          }

          .products-grid {
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 16px;
          }
        }

        @media (max-width: 640px) {
          .products-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { HeroSection } from '@/components/home/HeroSection'
import { CategoriesGrid } from '@/components/home/CategoriesGrid'
import { CompaniesTabsSection } from '@/components/home/CompaniesTabsSection'
import { FeaturedProductsSection } from '@/components/home/FeaturedProductsSection'
import { 
  getCategories, 
  getFeaturedCompanies, 
  getFeaturedProducts 
} from '@/lib/firebase-service'
import { populateFirebase } from '@/scripts/populate-firebase'
import { Company, CompanyCategory, Product } from '@/types'

export default function Home() {
  const [categories, setCategories] = useState<CompanyCategory[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  
  // REMOVIDO: trackPageView manual - o AnalyticsService já faz automaticamente

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Load data in parallel
        const [categoriesData, companiesData, productsData] = await Promise.all([
          getCategories(),
          getFeaturedCompanies(5),
          getFeaturedProducts(5)
        ])

        setCategories(categoriesData)
        setCompanies(companiesData)
        setProducts(productsData)
      } catch (error) {
        console.error('Error loading home data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p className="mt-4 text-gray-600">Carregando...</p>
          </div>
        </div>
        <style jsx>{`
          .loading-spinner {
            text-align: center;
          }
          
          .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #ff5a5f;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </Layout>
    )
  }

  return (
    <Layout>
      {/* Hero Section with Search */}
      <HeroSection />

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="categories-section">
          <div className="container mx-auto px-4">
            <h2 className="section-title">Navegue pelos destaques</h2>
            <CategoriesGrid categories={categories} />
          </div>
        </section>
      )}

    
      {/* Companies Directory Section */}
      {companies.length > 0 && (
        <CompaniesTabsSection companies={companies} />
      )}

      {/* Featured Products Section */}
      {products.length > 0 && (
        <FeaturedProductsSection products={products} />
      )}

      <style jsx>{`
        .categories-section {
          padding: 60px 0;
          background: white;
        }

        .section-title {
          font-size: 32px;
          font-weight: 700;
          text-align: center;
          margin-bottom: 40px;
          color: #333;
        }

        .how-it-works-section {
          padding: 80px 0;
          background: #f8f9fa;
        }

        .steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 40px;
          max-width: 1000px;
          margin: 0 auto;
        }

        .step {
          text-align: center;
        }

        .step-icon {
          margin-bottom: 24px;
        }

        .step-number {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #ff5a5f 0%, #ff7b7e 100%);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 700;
          margin: 0 auto;
          box-shadow: 0 8px 24px rgba(255, 90, 95, 0.3);
        }

        .step-title {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 12px;
          color: #333;
        }

        .step-description {
          font-size: 16px;
          color: #666;
          line-height: 1.6;
          margin: 0;
        }

        @media (max-width: 768px) {
          .categories-section {
            padding: 40px 0;
          }

          .how-it-works-section {
            padding: 60px 0;
          }

          .section-title {
            font-size: 24px;
            margin-bottom: 30px;
          }

          .steps-grid {
            gap: 30px;
          }

          .step-number {
            width: 60px;
            height: 60px;
            font-size: 20px;
          }

          .step-title {
            font-size: 18px;
          }

          .step-description {
            font-size: 14px;
          }
        }
      `}</style>
    </Layout>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Layout } from '@/components/layout/Layout'
import { ProductGallery } from '@/components/product/ProductGallery'
import { ProductInfo } from '@/components/product/ProductInfo'
import { ProductTabs } from '@/components/product/ProductTabs'
import { RelatedProducts } from '@/components/product/RelatedProducts'
import { getProductById, getRelatedProducts } from '@/lib/firebase-service'
import { Product } from '@/types'
import { ArrowLeft } from 'lucide-react'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProductData = async () => {
      try {
        setLoading(true)
        const productId = params.id as string

        // Buscar produto
        const productData = await getProductById(productId)
        
        if (!productData) {
          router.push('/') // Redirecionar se produto não encontrado
          return
        }

        setProduct(productData)

        // Buscar produtos relacionados da mesma empresa
        if (productData.companyOwner) {
          const related = await getRelatedProducts(productData.companyOwner, productId)
          setRelatedProducts(related)
        }
      } catch (error) {
        console.error('Error loading product data:', error)
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    loadProductData()
  }, [params.id, router])

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500"></div>
        </div>
      </Layout>
    )
  }

  if (!product) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Produto não encontrado</h2>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center px-4 py-2 bg-coral-500 text-white rounded-lg hover:bg-coral-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao início
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Back Button */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center text-gray-600 hover:text-coral-500 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Voltar
            </button>
          </div>
        </div>

        {/* Product Detail */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Product Gallery */}
            <ProductGallery images={product.imagesUrl} productName={product.name} />
            
            {/* Product Info */}
            <ProductInfo product={product} />
          </div>

          {/* Product Tabs */}
          <div className="mt-12">
            <ProductTabs product={product} />
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-16">
              <RelatedProducts 
                products={relatedProducts} 
                companyName={product.companyOwnerName || ''} 
              />
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
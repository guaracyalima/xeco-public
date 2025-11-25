'use client'

import { Product } from '@/types'
import { ProductCard } from '@/components/home/ProductCard'
import { ArrowRight } from 'lucide-react'

interface RelatedProductsProps {
  products: Product[]
  companyName: string
}

export function RelatedProducts({ products, companyName }: RelatedProductsProps) {
  if (products.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Outros produtos de {companyName}
          </h2>
          <p className="text-gray-600 mt-1">
            Confira mais opções desta franquia
          </p>
        </div>
        
        {products.length > 4 && (
          <button className="hidden md:flex items-center text-coral-500 hover:text-coral-600 font-medium transition-colors">
            Ver todos
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        )}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Mobile "Ver todos" button */}
      {products.length > 4 && (
        <div className="mt-6 md:hidden">
          <button className="w-full flex items-center justify-center text-coral-500 hover:text-coral-600 font-medium py-3 border border-coral-200 rounded-lg transition-colors">
            Ver todos os produtos
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      )}

      {/* No more products message */}
      {products.length < 2 && (
        <div className="text-center py-8 border-t mt-6">
          <p className="text-gray-500 text-sm">
            Esta franquia tem apenas este produto disponível no momento.
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Entre em contato para saber sobre outros produtos.
          </p>
        </div>
      )}
    </div>
  )
}
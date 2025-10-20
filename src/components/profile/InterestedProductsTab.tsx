'use client'

import { useLikedProductContext } from '@/contexts/LikedProductContext'
import Link from 'next/link'

export function InterestedProductsTab() {
  const { favoredProducts, loading, error, unfavoriteProduct } = useLikedProductContext()

  const handleRemove = async (productId: string) => {
    try {
      await unfavoriteProduct(productId)
    } catch (error) {
      console.error('Erro ao remover:', error)
    }
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
      <div className="space-y-3">
        {favoredProducts.map(product => (
          <div
            key={product.id}
            className="flex items-center justify-between p-4 bg-white border border-coral-100 rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{product.name}</h3>
              <p className="text-sm text-gray-600">
                Favoritado há pouco
              </p>
            </div>

            <div className="flex gap-2 ml-4">
              <Link
                href={`/produto/${product.id}`}
                className="px-4 py-2 bg-coral-50 hover:bg-coral-100 text-coral-600 font-medium text-sm rounded transition-colors"
              >
                Ver
              </Link>
              <button
                onClick={() => handleRemove(product.id)}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium text-sm rounded transition-colors"
              >
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

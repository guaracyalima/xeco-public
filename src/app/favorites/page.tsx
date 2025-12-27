'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Layout } from '@/components/layout/Layout'
import { useLikedCompanyContext } from '@/contexts/LikedCompanyContext'
import { useAuth } from '@/context/AuthContext'
import { Heart, Building2, ArrowLeft } from 'lucide-react'
import { FavoriteCompanyButton } from '@/components/favorites/FavoriteCompanyButton'
import { useAnalytics } from '@/hooks/useAnalytics'
import { EventName } from '@/types/analytics'

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth()
  const { favoredCompanies, loading: favoritesLoading } = useLikedCompanyContext()
  const { trackEvent } = useAnalytics()

  // Track page view
  useEffect(() => {
    if (!authLoading && user) {
      trackEvent(EventName.FAVORITES_VIEW, {
        eventData: {
          favoritesCount: favoredCompanies.length,
          category: 'favorites',
          label: 'favorites_page_view'
        }
      })
    }
  }, [authLoading, user, favoredCompanies.length, trackEvent])

  if (authLoading) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto text-center">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Entre para ver seus favoritos
            </h1>
            <p className="text-gray-600 mb-6">
              Faça login para ver suas empresas favoritas
            </p>
            <Link
              href="/login?returnUrl=/favorites"
              className="inline-block bg-coral-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-coral-600 transition-colors"
            >
              Fazer Login
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout className="bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/"
              className="inline-flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
            <Heart className="h-8 w-8 text-coral-500 fill-current" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Empresas Favoritas
              </h1>
              <p className="text-gray-600">
                {favoredCompanies.length} {favoredCompanies.length === 1 ? 'empresa favoritada' : 'empresas favoritadas'}
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {favoritesLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando favoritos...</p>
          </div>
        )}

        {/* Empty State */}
        {!favoritesLoading && favoredCompanies.length === 0 && (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhuma empresa favoritada ainda
            </h2>
            <p className="text-gray-600 mb-6">
              Comece explorando produtos e favoritando empresas que você gosta
            </p>
            <Link
              href="/"
              className="inline-block bg-coral-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-coral-600 transition-colors"
            >
              Explorar Produtos
            </Link>
          </div>
        )}

        {/* Favorites List */}
        {!favoritesLoading && favoredCompanies.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {favoredCompanies.map((company) => (
              <div
                key={company.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-coral-50 rounded-lg">
                      <Building2 className="h-6 w-6 text-coral-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {company.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Categoria: {company.categoryId}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <FavoriteCompanyButton
                    companyId={company.id}
                    companyName={company.name}
                    size="sm"
                    showText={false}
                  />
                  <Link
                    href={`/company/${company.id}`}
                    className="flex-1 text-center bg-gray-100 text-gray-700 px-3 py-2 text-sm rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Ver Produtos
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
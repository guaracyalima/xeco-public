'use client'

import { useLikedCompanyContext } from '@/contexts/LikedCompanyContext'
import { FollowedCompanyCard } from './FollowedCompanyCard'

export function FollowingCompaniesTab() {
  const { favoredCompanies, loading, error, unfavoriteCompany } = useLikedCompanyContext()

  const handleUnfavorite = async (companyId: string) => {
    try {
      await unfavoriteCompany(companyId)
    } catch (err) {
      console.error('Erro ao desfavoritar:', err)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500"></div>
          <p className="mt-3 text-gray-600">Carregando empresas...</p>
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

  if (favoredCompanies.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🏢</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Nenhuma empresa favoritada
          </h3>
          <p className="text-gray-600">
            Comece a favoritar empresas para acompanhar suas ofertas!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {favoredCompanies.map(company => (
          <FollowedCompanyCard
            key={company.id}
            company={company}
            onUnfollow={() => handleUnfavorite(company.id)}
          />
        ))}
      </div>
    </div>
  )
}

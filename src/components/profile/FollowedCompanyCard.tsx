'use client'

import { Company } from '@/types'
import Link from 'next/link'
import { Star, MapPin, Phone } from 'lucide-react'

interface FollowedCompanyCardProps {
  company: Company
  onUnfollow?: () => void
}

export function FollowedCompanyCard({ company, onUnfollow }: FollowedCompanyCardProps) {
  const logo = company.logo || '/default-fail-image.jpg'

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4">
      {/* Logo */}
      <div className="mb-3 h-32 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
        <img
          src={logo}
          alt={company.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = '/default-fail-image.jpg'
          }}
        />
      </div>

      {/* Nome da Empresa */}
      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm">
        {company.name}
      </h3>

      {/* Informações */}
      <div className="space-y-1 mb-3">
        {/* Localização */}
        {company.city && (
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <MapPin className="w-3 h-3" />
            <span className="line-clamp-1">
              {company.city}, {company.state}
            </span>
          </div>
        )}

        {/* Telefone */}
        {company.phone && (
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Phone className="w-3 h-3" />
            <a href={`tel:${company.phone}`} className="hover:text-coral-500">
              {company.phone}
            </a>
          </div>
        )}
      </div>

      {/* Descrição */}
      {company.about && (
        <p className="text-xs text-gray-600 line-clamp-2 mb-3">{company.about}</p>
      )}

      {/* Botões */}
      <div className="flex gap-2">
        <Link
          href={`/company/${company.id}`}
          className="flex-1 px-3 py-2 bg-coral-50 hover:bg-coral-100 text-coral-600 font-medium text-xs rounded transition-colors text-center"
        >
          Ver Detalhes
        </Link>

        {onUnfollow && (
          <button
            onClick={onUnfollow}
            className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium text-xs rounded transition-colors"
          >
            Deixar de Seguir
          </button>
        )}
      </div>
    </div>
  )
}

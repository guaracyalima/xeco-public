'use client'

import { Company } from '@/types'
import { MapPin, Phone, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCompanyAnalytics } from '@/hooks/useAnalytics'

interface CompanyCardProps {
  company: Company
  showBadge?: string
}

export function CompanyCard({ company, showBadge }: CompanyCardProps) {
  const router = useRouter()
  const { trackCompanyContact } = useCompanyAnalytics()

  const handleClick = () => {
    router.push(`/company/${company.id}`)
  }

  const handlePhoneClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    trackCompanyContact(company, 'phone')
    window.open(`tel:${company.phone}`, '_self')
  }

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    trackCompanyContact(company, 'whatsapp')
    window.open(`https://wa.me/${company.whatsapp.replace(/\D/g, '')}`, '_blank')
  }

  return (
    <div onClick={handleClick} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100 hover:border-coral-500 overflow-hidden group cursor-pointer">
      {/* Company Logo/Image */}
      <div className="h-48 relative overflow-hidden">
        {company.logo ? (
          <img 
            src={company.logo} 
            alt={company.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              ;(e.target as HTMLImageElement).src = '/default-fail-image.jpg'
            }}
          />
        ) : (
          <img 
            src="/default-fail-image.jpg"
            alt={company.name}
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Badge */}
        {showBadge && (
          <div className="absolute top-3 left-3 bg-coral-500 text-white px-2 py-1 rounded text-xs font-semibold uppercase">
            {showBadge}
          </div>
        )}

        {/* Action buttons */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
          <button 
            onClick={handlePhoneClick}
            className="w-9 h-9 bg-white/90 hover:bg-white text-gray-600 hover:text-coral-500 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all"
            title="Ligar"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button 
            onClick={handleWhatsAppClick}
            className="w-9 h-9 bg-white/90 hover:bg-white text-gray-600 hover:text-green-500 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all"
            title="WhatsApp"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.787"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Company Info */}
      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">{company.name}</h3>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold text-gray-900">4.5</span>
            <Star className="w-4 h-4 fill-current text-yellow-400" />
            <span className="text-xs text-gray-500">12 avaliações</span>
          </div>
        </div>

        <div className="flex items-center gap-1 mb-3 text-gray-600">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">{company.city}, {company.state}</span>
        </div>

        {company.about && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
            {company.about.substring(0, 100)}
            {company.about.length > 100 ? '...' : ''}
          </p>
        )}

        <div className="flex items-center">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Aberto agora!
          </span>
        </div>
      </div>
    </div>
  )
}
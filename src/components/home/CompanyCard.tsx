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
    <div onClick={handleClick} className="company-card group cursor-pointer">
      {/* Company Logo/Image */}
      <div className="company-image">
        {company.logo ? (
          <img 
            src={company.logo} 
            alt={company.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="bg-gray-200 w-full h-full flex items-center justify-center">
            <span className="text-gray-400 font-bold text-2xl">
              {company.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        
        {/* Badge */}
        {showBadge && (
          <div className="company-badge">
            {showBadge}
          </div>
        )}

        {/* Action buttons */}
        <div className="company-actions">
          <button 
            onClick={handlePhoneClick}
            className="action-btn"
            title="Ligar"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button 
            onClick={handleWhatsAppClick}
            className="action-btn"
            title="WhatsApp"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.787"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Company Info */}
      <div className="company-content">
        <h3 className="company-title">{company.name}</h3>
        
        <div className="company-meta">
          <div className="company-rating">
            <div className="rating-value">4.5</div>
            <Star className="w-4 h-4 fill-current text-yellow-400" />
            <span className="rating-count">12 avaliações</span>
          </div>
        </div>

        <div className="company-location">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span>{company.city}, {company.state}</span>
        </div>

        {company.about && (
          <p className="company-description">
            {company.about.substring(0, 100)}
            {company.about.length > 100 ? '...' : ''}
          </p>
        )}

        <div className="company-status">
          <span className="status-indicator status-open">Aberto agora!</span>
        </div>
      </div>

      <style jsx>{`
        .company-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          transition: all 0.3s ease;
          border: 1px solid #f0f0f0;
        }

        .company-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          border-color: #ff5a5f;
        }

        .company-image {
          height: 200px;
          position: relative;
          overflow: hidden;
        }

        .company-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: #ff5a5f;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .company-actions {
          position: absolute;
          top: 12px;
          right: 12px;
          display: flex;
          gap: 8px;
          opacity: 0;
          transform: translateY(-10px);
          transition: all 0.3s ease;
        }

        .group:hover .company-actions {
          opacity: 1;
          transform: translateY(0);
        }

        .action-btn {
          width: 36px;
          height: 36px;
          background: rgba(255, 255, 255, 0.9);
          color: #666;
          border: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(4px);
        }

        .action-btn:hover {
          background: white;
          color: #ff5a5f;
          transform: scale(1.1);
        }

        .company-content {
          padding: 16px;
        }

        .company-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #333;
          line-height: 1.3;
        }

        .company-meta {
          margin-bottom: 8px;
        }

        .company-rating {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 8px;
        }

        .rating-value {
          background: #ffba00;
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }

        .rating-count {
          font-size: 12px;
          color: #666;
        }

        .company-location {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
          color: #666;
          margin-bottom: 8px;
        }

        .company-description {
          font-size: 14px;
          color: #666;
          line-height: 1.4;
          margin-bottom: 12px;
        }

        .company-status {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-indicator {
          font-size: 12px;
          font-weight: 500;
          padding: 2px 0;
        }

        .status-open {
          color: #67981a;
        }

        .status-closed {
          color: #ff0000;
        }
      `}</style>
    </div>
  )
}
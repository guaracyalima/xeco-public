'use client'

import { Company } from '@/types'
import { CompanyCard } from './CompanyCard'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface CompaniesTabsSectionProps {
  companies: Company[]
  title?: string
}

export function CompaniesTabsSection({ companies, title = "Aqui pertinho" }: CompaniesTabsSectionProps) {
  // Show only first 6 companies
  const displayCompanies = companies.slice(0, 6)

  return (
    <section className="companies-section">
      <div className="container mx-auto px-4">
        <div className="section-header">
          <div className="header-content">
            <h2 className="section-title">{title}</h2>
            <p className="section-subtitle">Descubra franquias digitais incríveis na sua região</p>
          </div>
          
          {/* Ver todos button */}
          <Link href="/companies" className="view-all-btn">
            <span>Ver todos</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Companies Grid */}
        <div className="companies-grid">
          {displayCompanies.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
            />
          ))}
        </div>

        {displayCompanies.length === 0 && (
          <div className="empty-state">
            <p className="text-gray-500 text-center">
              Nenhuma empresa encontrada.
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        .companies-section {
          padding: 80px 0;
          background: #f8f9fa;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 40px;
          flex-wrap: wrap;
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

        .companies-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 24px;
        }

        .empty-state {
          padding: 60px 0;
        }

        @media (max-width: 768px) {
          .companies-section {
            padding: 40px 0;
          }

          .section-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .section-title {
            font-size: 24px;
          }

          .companies-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .view-all-btn {
            align-self: stretch;
            justify-content: center;
          }
        }
      `}</style>
    </section>
  )
}
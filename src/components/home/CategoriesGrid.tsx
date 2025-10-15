'use client'

import { CompanyCategory } from '@/types'
import { useRouter } from 'next/navigation'

interface CategoriesGridProps {
  categories: CompanyCategory[]
}

export function CategoriesGrid({ categories }: CategoriesGridProps) {
  const router = useRouter()

  const handleCategoryClick = (category: CompanyCategory) => {
    router.push(`/search?category=${category.id}`)
  }

  // Show only first 7 categories for home page
  const displayCategories = categories.slice(0, 7)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {displayCategories.map((category) => (
        <div
          key={category.id}
          onClick={() => handleCategoryClick(category)}
          className="category-card group cursor-pointer"
        >
          <div className="category-icon-wrapper" style={{ backgroundColor: category.color }}>
            {/* Render icon - you might want to use a proper icon library */}
            <div className="category-icon">
              {category.icon ? (
                <img 
                  src={category.icon} 
                  alt={category.name}
                  className="w-8 h-8 object-contain"
                />
              ) : (
                <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {category.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="category-name">
            {category.name}
          </div>
        </div>
      ))}

      <style jsx>{`
        .category-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 16px;
          border-radius: 8px;
          transition: all 0.3s ease;
          background: white;
          border: 1px solid #f0f0f0;
        }

        .category-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          border-color: #ff5a5f;
        }

        .category-icon-wrapper {
          width: 64px;
          height: 64px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          transition: all 0.3s ease;
        }

        .group:hover .category-icon-wrapper {
          transform: scale(1.1);
        }

        .category-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .category-name {
          font-size: 14px;
          font-weight: 500;
          color: #333;
          line-height: 1.3;
        }

        @media (max-width: 640px) {
          .category-card {
            padding: 12px 8px;
          }
          
          .category-icon-wrapper {
            width: 56px;
            height: 56px;
          }
          
          .category-name {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  )
}
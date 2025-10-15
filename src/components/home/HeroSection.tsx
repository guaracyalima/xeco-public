'use client'

import { useState } from 'react'
import { Search, MapPin } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface HeroSectionProps {
  onSearch?: (query: string, location: string) => void
}

export function HeroSection({ onSearch }: HeroSectionProps) {
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const router = useRouter()

  const handleSearch = () => {
    if (onSearch) {
      onSearch(query, location)
    } else {
      // Navigate to search results page
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      if (location) params.set('location', location)
      router.push(`/search?${params.toString()}`)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <section className="hero">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="hero-title">
            <span className="block">Descubra</span>
            <span className="block text-white/90">sua cidade incrível</span>
          </h1>
          <p className="hero-subtitle">
            Encontre ótimos lugares para ficar, comer, comprar ou visitar com especialistas locais.
          </p>

          {/* Search Bar */}
          <div className="search-bar max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row overflow-hidden">
              {/* What field */}
              <div className="flex-1 relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Search className="w-5 h-5" />
                </div>
                <Input
                  type="text"
                  placeholder="Ex: comida, serviço, produtos, hotel"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-12 border-none focus:ring-0 rounded-none sm:rounded-l-lg h-14"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <span className="text-xs text-gray-500 font-medium">O QUE</span>
                </div>
              </div>

              {/* Where field */}
              <div className="flex-1 relative border-t sm:border-t-0 sm:border-l border-gray-200">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <Input
                  type="text"
                  placeholder="Cidade, Estado"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-12 border-none focus:ring-0 rounded-none h-14"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <span className="text-xs text-gray-500 font-medium">ONDE</span>
                </div>
              </div>

              {/* Search button */}
              <Button
                onClick={handleSearch}
                className="btn-search h-14 rounded-none sm:rounded-r-lg"
              >
                <Search className="w-5 h-5" />
                <span className="hidden sm:inline">Buscar</span>
              </Button>
            </div>
          </div>

          {/* Browse highlights text */}
          <p className="text-white/80 mt-6 mb-8">
            Ou navegue pelos destaques
          </p>
        </div>
      </div>

      <style jsx>{`
        .hero {
          background: linear-gradient(135deg, #ff5a5f 0%, #ff7b7e 100%);
          color: white;
          padding: 120px 0 80px;
          position: relative;
          overflow: hidden;
        }

        .hero-title {
          font-size: 48px;
          font-weight: 700;
          margin-bottom: 16px;
          line-height: 1.2;
        }

        .hero-subtitle {
          font-size: 20px;
          opacity: 0.9;
          margin-bottom: 32px;
        }

        .search-bar {
          background: white;
          border-radius: 8px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .btn-search {
          background-color: #ff5a5f;
          color: white;
          border: none;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.3s ease;
        }

        .btn-search:hover {
          background-color: #e54b50;
        }

        @media (max-width: 768px) {
          .hero {
            padding: 80px 0 60px;
          }
          
          .hero-title {
            font-size: 32px;
          }
          
          .hero-subtitle {
            font-size: 18px;
          }
        }
      `}</style>
    </section>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { Search, MapPin, ChevronDown, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useSearchAnalytics } from '@/hooks/useAnalytics'
import { useLocationContext } from '@/contexts/LocationContext'
import { collection, query as firestoreQuery, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface HeroSectionProps {
  onSearch?: (query: string, location: string) => void
}

const BRAZILIAN_STATES = [
  { code: 'AC', name: 'Acre' },
  { code: 'AL', name: 'Alagoas' },
  { code: 'AP', name: 'Amapá' },
  { code: 'AM', name: 'Amazonas' },
  { code: 'BA', name: 'Bahia' },
  { code: 'CE', name: 'Ceará' },
  { code: 'DF', name: 'Distrito Federal' },
  { code: 'ES', name: 'Espírito Santo' },
  { code: 'GO', name: 'Goiás' },
  { code: 'MA', name: 'Maranhão' },
  { code: 'MT', name: 'Mato Grosso' },
  { code: 'MS', name: 'Mato Grosso do Sul' },
  { code: 'MG', name: 'Minas Gerais' },
  { code: 'PA', name: 'Pará' },
  { code: 'PB', name: 'Paraíba' },
  { code: 'PR', name: 'Paraná' },
  { code: 'PE', name: 'Pernambuco' },
  { code: 'PI', name: 'Piauí' },
  { code: 'RJ', name: 'Rio de Janeiro' },
  { code: 'RN', name: 'Rio Grande do Norte' },
  { code: 'RS', name: 'Rio Grande do Sul' },
  { code: 'RO', name: 'Rondônia' },
  { code: 'RR', name: 'Roraima' },
  { code: 'SC', name: 'Santa Catarina' },
  { code: 'SP', name: 'São Paulo' },
  { code: 'SE', name: 'Sergipe' },
  { code: 'TO', name: 'Tocantins' }
]

export function HeroSection({ onSearch }: HeroSectionProps) {
  const [query, setQuery] = useState('')
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [selectedState, setSelectedState] = useState('')
  const [cities, setCities] = useState<string[]>([])
  const [citySearch, setCitySearch] = useState('')
  const [loadingCities, setLoadingCities] = useState(false)
  const router = useRouter()
  const { trackSearch } = useSearchAnalytics()
  const { location, isLoading, updateLocation } = useLocationContext()

  // Estados locais para o modal
  const [city, setCity] = useState('')
  const [state, setState] = useState('')

  // Sincronizar com o contexto de localização
  useEffect(() => {
    if (location) {
      setCity(location.city)
      setState(location.state)
    }
  }, [location])

  // Buscar cidades quando estado for selecionado
  useEffect(() => {
    const loadCities = async () => {
      if (!selectedState) {
        setCities([])
        return
      }

      setLoadingCities(true)
      try {
        // Buscar cidades de produtos
        const productsQuery = firestoreQuery(
          collection(db, 'product'),
          where('uf', '==', selectedState),
          where('active', '==', 'SIM')
        )
        const productsSnapshot = await getDocs(productsQuery)
        
        // Buscar cidades de empresas
        const companiesQuery = firestoreQuery(
          collection(db, 'companies'),
          where('state', '==', selectedState),
          where('status', '==', true)
        )
        const companiesSnapshot = await getDocs(companiesQuery)

        const citiesSet = new Set<string>()
        
        productsSnapshot.docs.forEach(doc => {
          const cityName = doc.data().cidade
          if (cityName) citiesSet.add(cityName)
        })
        
        companiesSnapshot.docs.forEach(doc => {
          const cityName = doc.data().city
          if (cityName) citiesSet.add(cityName)
        })

        const cityList = Array.from(citiesSet).sort()
        setCities(cityList)
      } catch (error) {
        console.error('Erro ao buscar cidades:', error)
      } finally {
        setLoadingCities(false)
      }
    }

    loadCities()
  }, [selectedState])

  // Filtrar cidades pela busca
  const filteredCities = cities.filter(c => 
    c.toLowerCase().includes(citySearch.toLowerCase())
  )

  const handleSearch = () => {
    if (!query.trim()) return

    // Track the search
    trackSearch(query, 0, { city, state, source: 'hero_section' })

    if (onSearch) {
      onSearch(query, `${city}, ${state}`)
    } else {
      // Navigate to search results page
      const params = new URLSearchParams()
      params.set('q', query)
      if (city) params.set('city', city)
      if (state) params.set('state', state)
      router.push(`/search?${params.toString()}`)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleSelectLocation = (selectedCity: string) => {
    // Atualizar contexto global
    updateLocation(selectedCity, selectedState)
    
    // Atualizar estados locais
    setCity(selectedCity)
    setState(selectedState)
    
    // Fechar modal
    setShowLocationModal(false)
    setCitySearch('')
    
    console.log('📍 Localização atualizada:', `${selectedCity}, ${selectedState}`)
  }

  return (
    <section className="hero">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="hero-title">
            <span className="block">Conecte-se com</span>
            <span className="block text-white/90">franquias digitais locais</span>
          </h1>
          <p className="hero-subtitle">
            Descubra produtos incríveis e serviços de qualidade das melhores franquias da sua região.
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
                  className="pl-12 border-none focus:ring-0 rounded-none sm:rounded-l-lg h-14 text-gray-900 placeholder-gray-400 bg-white"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  
                </div>
              </div>

              {/* Where field */}
              <div className="flex-1 relative border-t sm:border-t-0 sm:border-l border-gray-200">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <button
                  onClick={() => setShowLocationModal(true)}
                  className="w-full text-left pl-12 pr-12 h-14 border-none focus:ring-2 focus:ring-coral-500 rounded-none hover:bg-gray-50 transition-colors"
                >
                  {city && state ? (
                    <span className="text-gray-900">{city}, {state}</span>
                  ) : (
                    <span className="text-gray-400">Selecione cidade e estado</span>
                  )}
                </button>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">ONDE</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
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
        </div>
      </div>

      {/* Modal de Seleção de Localização */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">Selecione sua localização</h3>
              <button
                onClick={() => setShowLocationModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(80vh-140px)]">
              {/* Select State */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Estado
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value)
                    setCitySearch('')
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-transparent text-gray-900 bg-white"
                >
                  <option value="" className="text-gray-500">Selecione um estado</option>
                  {BRAZILIAN_STATES.map(st => (
                    <option key={st.code} value={st.code} className="text-gray-900">
                      {st.name} ({st.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Cities */}
              {selectedState && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Cidade
                  </label>
                  
                  {/* Search cities */}
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Buscar cidade..."
                      value={citySearch}
                      onChange={(e) => setCitySearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-400"
                    />
                  </div>

                  {/* Loading */}
                  {loadingCities ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-4 border-coral-500 border-t-transparent mx-auto"></div>
                      <p className="text-sm text-gray-600 mt-2">Carregando cidades...</p>
                    </div>
                  ) : filteredCities.length === 0 ? (
                    <p className="text-center text-gray-600 py-4">
                      Nenhuma cidade encontrada
                    </p>
                  ) : (
                    <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                      {filteredCities.map((cityName, index) => (
                        <button
                          key={index}
                          onClick={() => handleSelectLocation(cityName)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900 font-medium">{cityName}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowLocationModal(false)}
                className="w-full px-4 py-3 bg-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .hero {
          background: linear-gradient(135deg, var(--primary) 0%, #ff7b7e 100%);
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
          background-color: var(--primary);
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
          background-color: var(--primary-hover);
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
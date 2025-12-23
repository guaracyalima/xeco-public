'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Layout } from '@/components/layout/Layout'
import { CompanyCard } from '@/components/home/CompanyCard'
import { Company, CompanyCategory } from '@/types'
import { collection, query, where, orderBy, limit, startAfter, getDocs, QueryConstraint, DocumentData, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Filter, Search, ChevronDown, X } from 'lucide-react'
import { useLocationContext } from '@/contexts/LocationContext'

const COMPANIES_PER_PAGE = 12

// Função para normalizar texto (remover acentos e padronizar)
const normalizeText = (text: string): string => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

interface Filters {
  search: string
  city: string
  state: string
  categoryId: string
  sortBy: 'name' | 'recent'
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [categories, setCategories] = useState<CompanyCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [lastDoc, setLastDoc] = useState<DocumentData | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [citySuggestions, setCitySuggestions] = useState<string[]>([])
  const [showCitySuggestions, setShowCitySuggestions] = useState(false)
  const [searchInput, setSearchInput] = useState('') // Input local para debounce
  const [isSearching, setIsSearching] = useState(false) // Indicador de busca
  const { location } = useLocationContext()
  
  const [filters, setFilters] = useState<Filters>({
    search: '',
    city: location?.city || '',
    state: location?.state || '',
    categoryId: '',
    sortBy: 'recent'
  })

  // Sincronizar filtros com localização do contexto
  useEffect(() => {
    if (location) {
      setFilters(prev => ({
        ...prev,
        city: location.city,
        state: location.state
      }))
    }
  }, [location])

  // Filtrar sugestões de cidades baseado no que o usuário digitou (com normalização)
  const filteredCitySuggestions = useMemo(() => {
    if (!filters.city.trim() || !citySuggestions.length) return citySuggestions
    
    const normalizedInput = normalizeText(filters.city)
    return citySuggestions.filter(city => 
      normalizeText(city).includes(normalizedInput)
    )
  }, [filters.city, citySuggestions])

  // Localização agora é gerenciada pelo LocationContext

  // Buscar cidades quando estado mudar
  useEffect(() => {
    const loadCities = async () => {
      if (!filters.state) {
        setCitySuggestions([])
        return
      }

      try {
        console.log('🏙️ [CITIES] Buscando cidades do estado:', filters.state)
        
        // Buscar cidades únicas das empresas deste estado
        const q = query(
          collection(db, 'companies'),
          where('state', '==', filters.state),
          where('status', '==', true)
        )
        
        const snapshot = await getDocs(q)
        const cities = new Set<string>()
        
        snapshot.docs.forEach(doc => {
          const city = doc.data().city
          if (city) cities.add(city)
        })
        
        const cityList = Array.from(cities).sort()
        console.log('✅ [CITIES] Cidades encontradas:', cityList.length, cityList)
        setCitySuggestions(cityList)
      } catch (error) {
        console.error('❌ [CITIES] Erro ao buscar cidades:', error)
      }
    }

    loadCities()
  }, [filters.state])

  // Debounce para busca (melhora performance)
  useEffect(() => {
    if (searchInput !== filters.search) {
      setIsSearching(true)
    }
    
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        console.log('⏱️ [DEBOUNCE] Aplicando busca após delay:', searchInput)
        setFilters(prev => ({ ...prev, search: searchInput }))
        setIsSearching(false)
      }
    }, 300) // 300ms de delay

    return () => clearTimeout(timer)
  }, [searchInput, filters.search])

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'company_category'))
        const cats = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date()
        })) as CompanyCategory[]
        setCategories(cats)
      } catch (error) {
        console.error('Erro ao carregar categorias:', error)
      }
    }
    loadCategories()
  }, [])

  const buildQuery = useCallback((isLoadMore: boolean = false) => {
    const constraints: QueryConstraint[] = []
    
    // Sempre filtrar empresas ativas
    constraints.push(where('status', '==', true))
    
    // Filtro de estado
    if (filters.state.trim()) {
      constraints.push(where('state', '==', filters.state.trim().toUpperCase()))
    }
    
    // NÃO filtrar cidade no Firestore - faremos client-side com normalização
    
    // Filtro de categoria
    if (filters.categoryId) {
      constraints.push(where('category', '==', filters.categoryId))
    }
    
    // Ordenação
    switch (filters.sortBy) {
      case 'name':
        constraints.push(orderBy('name', 'asc'))
        break
      case 'recent':
      default:
        constraints.push(orderBy('created_at', 'desc'))
        break
    }
    
    // Paginação
    constraints.push(limit(COMPANIES_PER_PAGE))
    
    if (isLoadMore && lastDoc) {
      constraints.push(startAfter(lastDoc))
    }
    
    return query(collection(db, 'companies'), ...constraints)
  }, [filters, lastDoc])

  const loadCompanies = useCallback(async (isLoadMore: boolean = false) => {
    try {
      console.log('🏢 [COMPANIES] Iniciando carregamento...', { isLoadMore, filters })
      
      if (isLoadMore) {
        setLoadingMore(true)
        console.log('📄 [COMPANIES] Carregando mais empresas...')
      } else {
        setLoading(true)
        setCompanies([])
        setLastDoc(null)
        console.log('🆕 [COMPANIES] Carregamento inicial')
      }
      
      const q = buildQuery(isLoadMore)
      console.log('📊 [COMPANIES] Query construída:', q)
      
      const snapshot = await getDocs(q)
      console.log(`✅ [COMPANIES] ${snapshot.docs.length} documentos retornados do Firestore`)
      
      if (snapshot.empty) {
        console.warn('⚠️ [COMPANIES] Nenhum documento encontrado')
        setHasMore(false)
        if (!isLoadMore) {
          setCompanies([])
        }
        return
      }
      
      let newCompanies = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Company[]
      
      console.log('🏪 [COMPANIES] Empresas antes dos filtros client-side:', newCompanies.length)
      
      // Buscar nomes das categorias para as empresas
      const categoryIds = [...new Set(newCompanies.map(c => c.categoryId).filter(Boolean))]
      console.log('🏷️ [COMPANIES] Buscando nomes de categorias:', categoryIds.length)
      
      const categoryNamesMap: Record<string, string> = {}
      await Promise.all(
        categoryIds.map(async (categoryId) => {
          try {
            const categoryDoc = await getDoc(doc(db, 'company_category', categoryId))
            if (categoryDoc.exists()) {
              categoryNamesMap[categoryId] = categoryDoc.data().name || categoryId
            }
          } catch (error) {
            console.error(`❌ [COMPANIES] Erro ao buscar categoria ${categoryId}:`, error)
          }
        })
      )
      
      console.log('✅ [COMPANIES] Nomes de categorias carregados:', Object.keys(categoryNamesMap).length)
      
      // Adicionar nomes das categorias às empresas
      newCompanies = newCompanies.map(c => ({
        ...c,
        categoryName: categoryNamesMap[c.categoryId] || c.categoryId
      }))
      
      // Filtro de cidade no client-side (com normalização para ignorar acentos)
      if (filters.city.trim()) {
        const normalizedSearchCity = normalizeText(filters.city)
        console.log(`🏙️ [COMPANIES] Aplicando filtro de cidade: "${filters.city}" (normalizado: "${normalizedSearchCity}")`)
        const beforeCity = newCompanies.length
        newCompanies = newCompanies.filter(c => {
          const companyCity = c.city || ''
          const normalizedCompanyCity = normalizeText(companyCity)
          return normalizedCompanyCity.includes(normalizedSearchCity)
        })
        console.log(`✂️ [COMPANIES] Filtro de cidade: ${beforeCity} → ${newCompanies.length}`)
      }
      
      // Filtro de busca no client-side (busca em nome, about, categoryName) - com normalização
      if (filters.search.trim()) {
        const normalizedSearch = normalizeText(filters.search)
        console.log(`🔎 [COMPANIES] Aplicando filtro de busca: "${filters.search}" (normalizado: "${normalizedSearch}")`)
        const beforeSearch = newCompanies.length
        
        newCompanies = newCompanies.filter(c => {
          const normalizedName = normalizeText(c.name)
          const normalizedAbout = c.about ? normalizeText(c.about) : ''
          const normalizedCategoryName = c.categoryName ? normalizeText(c.categoryName) : ''
          
          const nameMatch = normalizedName.includes(normalizedSearch)
          const aboutMatch = normalizedAbout.includes(normalizedSearch)
          const categoryMatch = normalizedCategoryName.includes(normalizedSearch)
          
          if (nameMatch || aboutMatch || categoryMatch) {
            console.log(`   ✅ Encontrado: "${c.name}" ${nameMatch ? '(nome)' : aboutMatch ? '(about)' : '(categoria)'}`)
          }
          
          return nameMatch || aboutMatch || categoryMatch
        })
        
        console.log(`✂️ [COMPANIES] Filtro de busca: ${beforeSearch} → ${newCompanies.length}`)
      }
      
      console.log(`🎯 [COMPANIES] Total final após filtros: ${newCompanies.length}`)
      
      setCompanies(prev => isLoadMore ? [...prev, ...newCompanies] : newCompanies)
      setLastDoc(snapshot.docs[snapshot.docs.length - 1])
      setHasMore(snapshot.docs.length === COMPANIES_PER_PAGE)
      
      console.log('✅ [COMPANIES] Carregamento concluído!', {
        totalNaTela: isLoadMore ? companies.length + newCompanies.length : newCompanies.length,
        hasMore: snapshot.docs.length === COMPANIES_PER_PAGE
      })
      
    } catch (error) {
      console.error('❌ [COMPANIES] Erro ao carregar empresas:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [buildQuery, filters.search, filters.city, filters.state])

  // Carregar empresas iniciais
  useEffect(() => {
    loadCompanies(false)
  }, [filters])

  const handleFilterChange = (key: keyof Filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setSearchInput('')
    setFilters({
      search: '',
      city: '',
      state: '',
      categoryId: '',
      sortBy: 'recent'
    })
  }

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'sortBy') return false
    if (typeof value === 'string') return value.trim() !== ''
    return value !== null
  }).length

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-6">
            <h1 data-testid="page-title" className="text-3xl font-bold text-gray-900 mb-2">Todas as franquias digitais</h1>
            <p className="text-gray-600">Explore franquias digitais e estabelecimentos na sua região</p>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Buscar empresas... (nome, sobre, categoria)"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-transparent"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-coral-500 border-t-transparent"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Filter Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Filter className="h-5 w-5" />
                <span>Filtros</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-coral-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
                <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              {/* Sort */}
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-transparent"
              >
                <option value="recent">Mais recentes</option>
                <option value="name">Nome A-Z</option>
              </select>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                    <select
                      value={filters.state}
                      onChange={(e) => handleFilterChange('state', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-transparent"
                    >
                      <option value="">Todos os estados</option>
                      <option value="AC">Acre</option>
                      <option value="AL">Alagoas</option>
                      <option value="AP">Amapá</option>
                      <option value="AM">Amazonas</option>
                      <option value="BA">Bahia</option>
                      <option value="CE">Ceará</option>
                      <option value="DF">Distrito Federal</option>
                      <option value="ES">Espírito Santo</option>
                      <option value="GO">Goiás</option>
                      <option value="MA">Maranhão</option>
                      <option value="MT">Mato Grosso</option>
                      <option value="MS">Mato Grosso do Sul</option>
                      <option value="MG">Minas Gerais</option>
                      <option value="PA">Pará</option>
                      <option value="PB">Paraíba</option>
                      <option value="PR">Paraná</option>
                      <option value="PE">Pernambuco</option>
                      <option value="PI">Piauí</option>
                      <option value="RJ">Rio de Janeiro</option>
                      <option value="RN">Rio Grande do Norte</option>
                      <option value="RS">Rio Grande do Sul</option>
                      <option value="RO">Rondônia</option>
                      <option value="RR">Roraima</option>
                      <option value="SC">Santa Catarina</option>
                      <option value="SP">São Paulo</option>
                      <option value="SE">Sergipe</option>
                      <option value="TO">Tocantins</option>
                    </select>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
                    <input
                      type="text"
                      placeholder="Digite sua cidade"
                      value={filters.city}
                      onChange={(e) => {
                        handleFilterChange('city', e.target.value)
                        setShowCitySuggestions(true)
                      }}
                      onFocus={() => setShowCitySuggestions(true)}
                      onBlur={() => {
                        // Delay para permitir click nas sugestões
                        setTimeout(() => setShowCitySuggestions(false), 200)
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-transparent"
                    />
                    
                    {/* Autocomplete dropdown */}
                    {showCitySuggestions && filteredCitySuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredCitySuggestions.map((city, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              handleFilterChange('city', city)
                              setShowCitySuggestions(false)
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                          >
                            {city}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                    <select
                      value={filters.categoryId}
                      onChange={(e) => handleFilterChange('categoryId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-transparent"
                    >
                      <option value="">Todas as categorias</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Clear Filters */}
                  <div className="flex items-end">
                    <button
                      onClick={clearFilters}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4" />
                      Limpar Filtros
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Companies Grid */}
        <div className="container mx-auto px-4 py-8">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-500"></div>
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-600 text-lg">Nenhuma empresa encontrada</p>
              <button
                onClick={clearFilters}
                className="mt-4 text-coral-500 hover:text-coral-600 font-medium"
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {companies.map((company) => (
                  <CompanyCard key={company.id} company={company} />
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={() => loadCompanies(true)}
                    disabled={loadingMore}
                    className="px-8 py-3 bg-coral-500 hover:bg-coral-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingMore ? 'Carregando...' : 'Carregar mais'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}

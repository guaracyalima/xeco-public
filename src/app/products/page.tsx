'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Layout } from '@/components/layout/Layout'
import { ProductCard } from '@/components/home/ProductCard'
import { Product } from '@/types'
import { collection, query, where, orderBy, limit, startAfter, getDocs, getDoc, doc, QueryConstraint, DocumentData } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Filter, Search, ChevronDown, X } from 'lucide-react'

const PRODUCTS_PER_PAGE = 12

// Função para normalizar texto (remover acentos)
const normalizeText = (text: string): string => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

interface Filters {
  search: string
  minPrice: string
  maxPrice: string
  city: string
  state: string
  onPromotion: boolean | null
  productType: 'PRODUTO' | 'SERVICO' | null
  productFormat: 'Fisico' | 'Digital' | null
  sortBy: 'price_asc' | 'price_desc' | 'recent' | 'name'
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [lastDoc, setLastDoc] = useState<DocumentData | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [userLocation, setUserLocation] = useState<{ city: string; state: string } | null>(null)
  const [citySuggestions, setCitySuggestions] = useState<string[]>([])
  const [showCitySuggestions, setShowCitySuggestions] = useState(false)
  const [searchInput, setSearchInput] = useState('') // Input local para debounce
  const [isSearching, setIsSearching] = useState(false) // Indicador de busca em andamento
  
  const [filters, setFilters] = useState<Filters>({
    search: '',
    minPrice: '',
    maxPrice: '',
    city: '',
    state: '',
    onPromotion: null,
    productType: null,
    productFormat: null,
    sortBy: 'recent'
  })

  // Filtrar sugestões de cidades baseado no que o usuário digitou (com normalização)
  const filteredCitySuggestions = useMemo(() => {
    if (!filters.city.trim() || !citySuggestions.length) return citySuggestions
    
    const normalizedInput = normalizeText(filters.city)
    return citySuggestions.filter(city => 
      normalizeText(city).includes(normalizedInput)
    )
  }, [filters.city, citySuggestions])

  // Detectar localização do usuário
  useEffect(() => {
    const detectLocation = async () => {
      try {
        console.log('📍 [LOCATION] Iniciando detecção de localização...')
        
        // Tentar obter do localStorage primeiro
        const savedCity = localStorage.getItem('userCity')
        const savedState = localStorage.getItem('userState')
        
        if (savedCity && savedState) {
          console.log('💾 [LOCATION] Localização encontrada no localStorage:', { savedCity, savedState })
          setUserLocation({ city: savedCity, state: savedState })
          setFilters(prev => ({ ...prev, city: savedCity, state: savedState }))
          return
        }

        console.log('🌍 [LOCATION] Tentando geolocalização do navegador...')
        
        // Se não tiver salvo, tenta pela geolocalização
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords
              console.log('🎯 [LOCATION] Coordenadas obtidas:', { latitude, longitude })
              
              // Usar API de geocoding reverso (exemplo com OpenStreetMap - grátis)
              const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
              console.log('🌐 [LOCATION] Consultando Nominatim:', url)
              
              const response = await fetch(url)
              const data = await response.json()
              console.log('📦 [LOCATION] Resposta do Nominatim:', data)
              
              if (data.address) {
                const city = data.address.city || data.address.town || data.address.village || ''
                const state = data.address.state || ''
                console.log('🏙️ [LOCATION] Endereço extraído:', { city, state })
                
                if (city && state) {
                  // Mapear nome do estado para sigla (simplificado - você pode melhorar isso)
                  const stateAbbr = state.substring(0, 2).toUpperCase()
                  console.log('✅ [LOCATION] Localização detectada:', { city, state: stateAbbr })
                  
                  setUserLocation({ city, state: stateAbbr })
                  setFilters(prev => ({ ...prev, city, state: stateAbbr }))
                  
                  // Salvar no localStorage
                  localStorage.setItem('userCity', city)
                  localStorage.setItem('userState', stateAbbr)
                  console.log('💾 [LOCATION] Localização salva no localStorage')
                } else {
                  console.warn('⚠️ [LOCATION] Cidade ou estado não encontrados')
                }
              } else {
                console.warn('⚠️ [LOCATION] Endereço não encontrado na resposta')
              }
            },
            (error) => {
              console.warn('❌ [LOCATION] Erro ao obter localização:', error.message)
            }
          )
        } else {
          console.warn('❌ [LOCATION] Geolocalização não disponível no navegador')
        }
      } catch (error) {
        console.error('❌ [LOCATION] Erro ao detectar localização:', error)
      }
    }

    detectLocation()
  }, [])

  // Buscar cidades quando estado mudar
  useEffect(() => {
    const loadCities = async () => {
      if (!filters.state) {
        setCitySuggestions([])
        return
      }

      try {
        console.log('🏙️ [CITIES] Buscando cidades do estado:', filters.state)
        
        // Buscar cidades únicas dos produtos deste estado
        const q = query(
          collection(db, 'product'),
          where('uf', '==', filters.state),
          where('active', '==', 'SIM')
        )
        
        const snapshot = await getDocs(q)
        const cities = new Set<string>()
        
        snapshot.docs.forEach(doc => {
          const city = doc.data().cidade
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

  // Debounce para busca (melhora performance e SEO)
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

  const buildQuery = useCallback((isLoadMore: boolean = false) => {
    const constraints: QueryConstraint[] = []
    
    // Sempre filtrar produtos ativos e com estoque
    constraints.push(where('active', '==', 'SIM'))
    constraints.push(where('stockQuantity', '>', 0))
    
    // Filtro de busca (nome do produto)
    if (filters.search.trim()) {
      // Firestore não suporta LIKE, vamos fazer busca case-insensitive depois
      // Por enquanto, filtraremos no client-side
    }
    
    // Filtro de estado
    if (filters.state.trim()) {
      constraints.push(where('uf', '==', filters.state.trim()))
    }
    
    // NÃO filtrar cidade no Firestore - faremos client-side com normalização
    
    // Filtro de estado
    if (filters.state.trim()) {
      constraints.push(where('uf', '==', filters.state.trim().toUpperCase()))
    }
    
    // Filtro de promoção
    if (filters.onPromotion !== null) {
      constraints.push(where('promotion', '==', filters.onPromotion))
    }
    
    // Filtro de tipo (produto ou serviço)
    if (filters.productType) {
      constraints.push(where('produtoOuServico', '==', filters.productType))
    }
    
    // Filtro de formato (físico ou digital)
    if (filters.productFormat) {
      constraints.push(where('tipo_produto', '==', filters.productFormat))
    }
    
    // Ordenação
    switch (filters.sortBy) {
      case 'price_asc':
        constraints.push(orderBy('salePrice', 'asc'))
        break
      case 'price_desc':
        constraints.push(orderBy('salePrice', 'desc'))
        break
      case 'name':
        constraints.push(orderBy('name', 'asc'))
        break
      case 'recent':
      default:
        constraints.push(orderBy('created_at', 'desc'))
        break
    }
    
    // Paginação
    constraints.push(limit(PRODUCTS_PER_PAGE))
    
    if (isLoadMore && lastDoc) {
      constraints.push(startAfter(lastDoc))
    }
    
    return query(collection(db, 'product'), ...constraints)
  }, [filters, lastDoc])

  const loadProducts = useCallback(async (isLoadMore: boolean = false) => {
    try {
      console.log('🔍 [PRODUCTS] Iniciando carregamento...', { isLoadMore, filters })
      
      // Cache de resultados (apenas para primeira carga)
      if (!isLoadMore) {
        const cacheKey = `products_cache_${JSON.stringify(filters)}`
        const cached = localStorage.getItem(cacheKey)
        
        if (cached) {
          const { data, timestamp } = JSON.parse(cached)
          const cacheAge = Date.now() - timestamp
          
          // Cache válido por 5 minutos
          if (cacheAge < 5 * 60 * 1000) {
            console.log('💾 [CACHE] Usando resultados em cache (idade: ' + Math.floor(cacheAge / 1000) + 's)')
            setProducts(data)
            setLoading(false)
            return
          } else {
            console.log('♻️ [CACHE] Cache expirado, buscando novos dados')
            localStorage.removeItem(cacheKey)
          }
        }
      }
      
      if (isLoadMore) {
        setLoadingMore(true)
        console.log('📄 [PRODUCTS] Carregando mais produtos...')
      } else {
        setLoading(true)
        setProducts([])
        setLastDoc(null)
        console.log('🆕 [PRODUCTS] Carregamento inicial')
      }
      
      const q = buildQuery(isLoadMore)
      console.log('📊 [PRODUCTS] Query construída:', q)
      
      const snapshot = await getDocs(q)
      console.log(`✅ [PRODUCTS] ${snapshot.docs.length} documentos retornados do Firestore`)
      
      if (snapshot.empty) {
        console.warn('⚠️ [PRODUCTS] Nenhum documento encontrado')
        setHasMore(false)
        return
      }
      
      let newProducts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Product[]
      
      console.log('📦 [PRODUCTS] Produtos antes dos filtros client-side:', newProducts.length)
      
      // Filtro de cidade no client-side (com normalização para ignorar acentos)
      if (filters.city.trim()) {
        const normalizedSearchCity = normalizeText(filters.city)
        console.log(`🏙️ [PRODUCTS] Aplicando filtro de cidade: "${filters.city}" (normalizado: "${normalizedSearchCity}")`)
        const beforeCity = newProducts.length
        newProducts = newProducts.filter(p => {
          const productCity = p.cidade || ''
          const normalizedProductCity = normalizeText(productCity)
          return normalizedProductCity.includes(normalizedSearchCity)
        })
        console.log(`✂️ [PRODUCTS] Filtro de cidade: ${beforeCity} → ${newProducts.length}`)
      }
      
      // Filtro de busca no client-side (case-insensitive, sem acentos) - busca em nome E descrição
      if (filters.search.trim()) {
        const normalizedSearch = normalizeText(filters.search)
        console.log(`🔎 [PRODUCTS] Aplicando filtro de busca: "${filters.search}" (normalizado: "${normalizedSearch}")`)
        const beforeSearch = newProducts.length
        
        newProducts = newProducts.filter(p => {
          const normalizedName = normalizeText(p.name)
          const normalizedDesc = p.description ? normalizeText(p.description) : ''
          
          const nameMatch = normalizedName.includes(normalizedSearch)
          const descMatch = normalizedDesc.includes(normalizedSearch)
          
          if (nameMatch || descMatch) {
            console.log(`   ✅ Encontrado: "${p.name}" ${nameMatch ? '(nome)' : '(descrição)'}`)
          }
          
          return nameMatch || descMatch
        })
        console.log(`✂️ [PRODUCTS] Filtro de busca: ${beforeSearch} → ${newProducts.length}`)
      }
      
      // Filtro de preço no client-side
      if (filters.minPrice) {
        const min = parseFloat(filters.minPrice)
        console.log(`💰 [PRODUCTS] Aplicando filtro de preço mínimo: R$ ${min}`)
        const beforeMin = newProducts.length
        newProducts = newProducts.filter(p => {
          const price = typeof p.salePrice === 'number' ? p.salePrice : parseFloat(String(p.salePrice))
          return price >= min
        })
        console.log(`✂️ [PRODUCTS] Filtro preço mín: ${beforeMin} → ${newProducts.length}`)
      }
      
      if (filters.maxPrice) {
        const max = parseFloat(filters.maxPrice)
        console.log(`💰 [PRODUCTS] Aplicando filtro de preço máximo: R$ ${max}`)
        const beforeMax = newProducts.length
        newProducts = newProducts.filter(p => {
          const price = typeof p.salePrice === 'number' ? p.salePrice : parseFloat(String(p.salePrice))
          return price <= max
        })
        console.log(`✂️ [PRODUCTS] Filtro preço máx: ${beforeMax} → ${newProducts.length}`)
      }
      
      console.log(`🎯 [PRODUCTS] Total final após filtros: ${newProducts.length}`)
      
      // Buscar nomes das empresas para os produtos
      const companyIds = [...new Set(newProducts.map(p => p.companyOwner))]
      console.log('🏢 [PRODUCTS] Buscando nomes de empresas:', companyIds.length)
      
      const companyNames: Record<string, string> = {}
      await Promise.all(
        companyIds.map(async (companyId) => {
          try {
            const companyDoc = await getDoc(doc(db, 'companies', companyId))
            if (companyDoc.exists()) {
              companyNames[companyId] = companyDoc.data().name || companyId
            }
          } catch (error) {
            console.error(`❌ [PRODUCTS] Erro ao buscar empresa ${companyId}:`, error)
          }
        })
      )
      
      console.log('✅ [PRODUCTS] Nomes de empresas carregados:', Object.keys(companyNames).length)
      
      // Adicionar nomes das empresas aos produtos
      newProducts = newProducts.map(p => ({
        ...p,
        companyOwnerName: companyNames[p.companyOwner] || p.companyOwner
      }))
      
      const finalProducts = isLoadMore ? [...products, ...newProducts] : newProducts
      
      setProducts(finalProducts)
      setLastDoc(snapshot.docs[snapshot.docs.length - 1])
      setHasMore(snapshot.docs.length === PRODUCTS_PER_PAGE)
      
      // Salvar no cache (apenas primeira carga)
      if (!isLoadMore && finalProducts.length > 0) {
        const cacheKey = `products_cache_${JSON.stringify(filters)}`
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            data: finalProducts,
            timestamp: Date.now()
          }))
          console.log('💾 [CACHE] Resultados salvos no cache')
        } catch (error) {
          console.warn('⚠️ [CACHE] Erro ao salvar cache (localStorage cheio?):', error)
        }
      }
      
      console.log('✅ [PRODUCTS] Carregamento concluído!', {
        totalNaTela: isLoadMore ? products.length + newProducts.length : newProducts.length,
        hasMore: snapshot.docs.length === PRODUCTS_PER_PAGE
      })
      
    } catch (error) {
      console.error('❌ [PRODUCTS] Erro ao carregar produtos:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [buildQuery, filters.search, filters.minPrice, filters.maxPrice])

  // Carregar produtos iniciais
  useEffect(() => {
    loadProducts(false)
  }, [filters])

  const handleFilterChange = (key: keyof Filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    // Limpar cache ao resetar filtros
    console.log('🗑️ [CACHE] Limpando cache de produtos')
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('products_cache_')) {
        localStorage.removeItem(key)
      }
    })
    
    setSearchInput('')
    setFilters({
      search: '',
      minPrice: '',
      maxPrice: '',
      city: '',
      state: '',
      onPromotion: null,
      productType: null,
      productFormat: null,
      sortBy: 'recent'
    })
  }

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'sortBy') return false
    if (typeof value === 'string') return value.trim() !== ''
    if (typeof value === 'boolean') return true
    return value !== null
  }).length

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Todos os Produtos</h1>
            <p className="text-gray-600">Explore nossa seleção completa de produtos e serviços</p>
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
                    placeholder="Buscar produtos... (nome, descrição)"
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
                <option value="price_asc">Menor preço</option>
                <option value="price_desc">Maior preço</option>
                <option value="name">Nome A-Z</option>
              </select>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {/* Price Range Slider */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Faixa de Preço: R$ {filters.minPrice || '0'} - R$ {filters.maxPrice || '10000'}
                    </label>
                    <div className="flex gap-4 items-center">
                      <div className="flex-1">
                        <input
                          type="range"
                          min="0"
                          max="10000"
                          step="50"
                          value={filters.minPrice || '0'}
                          onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-coral-500"
                        />
                        <div className="text-xs text-gray-500 mt-1">Mínimo</div>
                      </div>
                      <div className="flex-1">
                        <input
                          type="range"
                          min="0"
                          max="10000"
                          step="50"
                          value={filters.maxPrice || '10000'}
                          onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-coral-500"
                        />
                        <div className="text-xs text-gray-500 mt-1">Máximo</div>
                      </div>
                    </div>
                  </div>

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

                  {/* Product Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                    <select
                      value={filters.productType || ''}
                      onChange={(e) => handleFilterChange('productType', e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-transparent"
                    >
                      <option value="">Todos</option>
                      <option value="PRODUTO">Produto</option>
                      <option value="SERVICO">Serviço</option>
                    </select>
                  </div>

                  {/* Product Format */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Formato</label>
                    <select
                      value={filters.productFormat || ''}
                      onChange={(e) => handleFilterChange('productFormat', e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-transparent"
                    >
                      <option value="">Todos</option>
                      <option value="Fisico">Físico</option>
                      <option value="Digital">Digital</option>
                    </select>
                  </div>

                  {/* Promotion Checkbox */}
                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.onPromotion === true}
                        onChange={(e) => handleFilterChange('onPromotion', e.target.checked ? true : null)}
                        className="w-5 h-5 text-coral-500 border-gray-300 rounded focus:ring-coral-500 cursor-pointer"
                      />
                      <span className="text-sm font-medium text-gray-700">Apenas em promoção</span>
                    </label>
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

        {/* Products Grid */}
        <div className="container mx-auto px-4 py-8">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-500"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-600 text-lg">Nenhum produto encontrado</p>
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
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={() => loadProducts(true)}
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

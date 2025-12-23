'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Layout } from '@/components/layout/Layout'
import { ProductCard } from '@/components/home/ProductCard'
import { CompanyCard } from '@/components/home/CompanyCard'
import { Product, Company } from '@/types'
import { collection, query, where, orderBy, limit, startAfter, getDocs, getDoc, doc, QueryConstraint, DocumentData } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Search, MapPin, Building2, Package, ChevronDown } from 'lucide-react'
import { useSearchAnalytics } from '@/hooks/useAnalytics'
import { useLocationContext } from '@/contexts/LocationContext'

const ITEMS_PER_PAGE = 12

// Função para normalizar texto (remover acentos)
const normalizeText = (text: string): string => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

type SearchType = 'all' | 'products' | 'companies'

function SearchPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const searchQuery = searchParams.get('q') || ''
  const cityParam = searchParams.get('city') || ''
  const stateParam = searchParams.get('state') || ''
  const { trackSearch, trackSearchResults, trackFilterApplied } = useSearchAnalytics()
  const { location } = useLocationContext()

  const [products, setProducts] = useState<Product[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMoreProducts, setHasMoreProducts] = useState(true)
  const [hasMoreCompanies, setHasMoreCompanies] = useState(true)
  const [lastProductDoc, setLastProductDoc] = useState<DocumentData | null>(null)
  const [lastCompanyDoc, setLastCompanyDoc] = useState<DocumentData | null>(null)
  const [searchType, setSearchType] = useState<SearchType>('all')
  
  // Usar localização do contexto ou parâmetros URL
  const userLocation = {
    city: cityParam || location?.city || '',
    state: stateParam || location?.state || ''
  }

  const loadProducts = useCallback(async (isLoadMore: boolean = false) => {
    if (!searchQuery.trim()) return

    try {
      console.log('🔍 [SEARCH-PRODUCTS] Buscando produtos...', { searchQuery, userLocation, isLoadMore })

      // Buscar todos os produtos ativos com estoque, sem filtro de localização no Firestore
      const constraints: QueryConstraint[] = [
        where('active', '==', 'SIM'),
        where('stockQuantity', '>', 0),
        orderBy('created_at', 'desc'),
        limit(ITEMS_PER_PAGE * 3) // Buscar mais para compensar o filtro client-side
      ]

      if (isLoadMore && lastProductDoc) {
        constraints.push(startAfter(lastProductDoc))
      }

      const q = query(collection(db, 'product'), ...constraints)
      const snapshot = await getDocs(q)

      if (snapshot.empty) {
        console.log('⚠️ [SEARCH-PRODUCTS] Nenhum produto encontrado')
        setHasMoreProducts(false)
        return
      }

      let newProducts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Product[]

      // Buscar nomes das empresas
      const companyIds = [...new Set(newProducts.map(p => p.companyOwner))]
      const companyNames: Record<string, string> = {}
      
      await Promise.all(
        companyIds.map(async (companyId) => {
          try {
            const companyDoc = await getDoc(doc(db, 'companies', companyId))
            if (companyDoc.exists()) {
              companyNames[companyId] = companyDoc.data().name || companyId
            }
          } catch (error) {
            console.error('Erro ao buscar empresa:', error)
          }
        })
      )

      newProducts = newProducts.map(p => ({
        ...p,
        companyOwnerName: companyNames[p.companyOwner] || p.companyOwner
      }))

      // Filtrar por busca e localização (client-side com normalização)
      const normalizedSearch = normalizeText(searchQuery)
      newProducts = newProducts.filter(p => {
        // Primeiro verifica se o termo de busca está presente
        const nameMatch = normalizeText(p.name).includes(normalizedSearch)
        const descMatch = p.description ? normalizeText(p.description).includes(normalizedSearch) : false
        const companyMatch = normalizeText(p.companyOwnerName || '').includes(normalizedSearch)
        const searchMatch = nameMatch || descMatch || companyMatch

        // Se tem localização, filtra por ela também
        if (userLocation.city && userLocation.state) {
          const cityMatch = normalizeText(p.cidade || '').includes(normalizeText(userLocation.city))
          const stateMatch = normalizeText(p.uf || '').includes(normalizeText(userLocation.state))
          return searchMatch && (cityMatch || stateMatch)
        }

        // Se não tem localização, retorna apenas pela busca
        return searchMatch
      })

      // Limitar aos primeiros ITEMS_PER_PAGE após filtragem
      if (!isLoadMore) {
        newProducts = newProducts.slice(0, ITEMS_PER_PAGE)
      }

      console.log(`✅ [SEARCH-PRODUCTS] ${newProducts.length} produtos encontrados`)

      setProducts(prev => isLoadMore ? [...prev, ...newProducts] : newProducts)
      setLastProductDoc(snapshot.docs[snapshot.docs.length - 1])
      setHasMoreProducts(snapshot.docs.length === ITEMS_PER_PAGE)

      // Track search results para produtos (apenas na primeira carga)
      if (!isLoadMore) {
        trackSearchResults(searchQuery, newProducts)
      }

    } catch (error) {
      console.error('❌ [SEARCH-PRODUCTS] Erro:', error)
    }
  }, [searchQuery, userLocation, trackSearchResults])

  const loadCompanies = useCallback(async (isLoadMore: boolean = false) => {
    if (!searchQuery.trim()) return

    try {
      console.log('🔍 [SEARCH-COMPANIES] Buscando empresas...', { searchQuery, userLocation, isLoadMore })

      // Buscar todas as empresas ativas, sem filtro de localização no Firestore
      const constraints: QueryConstraint[] = [
        where('status', '==', true),
        orderBy('created_at', 'desc'),
        limit(ITEMS_PER_PAGE * 3) // Buscar mais para compensar o filtro client-side
      ]

      if (isLoadMore && lastCompanyDoc) {
        constraints.push(startAfter(lastCompanyDoc))
      }

      const q = query(collection(db, 'companies'), ...constraints)
      const snapshot = await getDocs(q)

      if (snapshot.empty) {
        console.log('⚠️ [SEARCH-COMPANIES] Nenhuma empresa encontrada')
        setHasMoreCompanies(false)
        return
      }

      let newCompanies = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Company[]

      // Buscar nomes das categorias
      const categoryIds = [...new Set(newCompanies.map(c => c.categoryId).filter(Boolean))]
      const categoryNames: Record<string, string> = {}
      
      await Promise.all(
        categoryIds.map(async (categoryId) => {
          try {
            const categoryDoc = await getDoc(doc(db, 'company_category', categoryId))
            if (categoryDoc.exists()) {
              categoryNames[categoryId] = categoryDoc.data().name || categoryId
            }
          } catch (error) {
            console.error('Erro ao buscar categoria:', error)
          }
        })
      )

      newCompanies = newCompanies.map(c => ({
        ...c,
        categoryName: categoryNames[c.categoryId] || c.categoryId
      }))

      // Filtrar por busca e localização (client-side com normalização)
      const normalizedSearch = normalizeText(searchQuery)
      newCompanies = newCompanies.filter(c => {
        // Primeiro verifica se o termo de busca está presente
        const nameMatch = normalizeText(c.name).includes(normalizedSearch)
        const aboutMatch = c.about ? normalizeText(c.about).includes(normalizedSearch) : false
        const categoryMatch = c.categoryName ? normalizeText(c.categoryName).includes(normalizedSearch) : false
        const searchMatch = nameMatch || aboutMatch || categoryMatch

        // Se tem localização, filtra por ela também
        if (userLocation.city && userLocation.state) {
          const cityMatch = normalizeText(c.city || '').includes(normalizeText(userLocation.city))
          const stateMatch = normalizeText(c.state || '').includes(normalizeText(userLocation.state))
          return searchMatch && (cityMatch || stateMatch)
        }

        // Se não tem localização, retorna apenas pela busca
        return searchMatch
      })

      // Limitar aos primeiros ITEMS_PER_PAGE após filtragem
      if (!isLoadMore) {
        newCompanies = newCompanies.slice(0, ITEMS_PER_PAGE)
      }

      console.log(`✅ [SEARCH-COMPANIES] ${newCompanies.length} empresas encontradas`)

      setCompanies(prev => isLoadMore ? [...prev, ...newCompanies] : newCompanies)
      setLastCompanyDoc(snapshot.docs[snapshot.docs.length - 1])
      setHasMoreCompanies(snapshot.docs.length === ITEMS_PER_PAGE)

      // Track search results para empresas (apenas na primeira carga)
      if (!isLoadMore) {
        trackSearchResults(searchQuery, newCompanies)
      }

    } catch (error) {
      console.error('❌ [SEARCH-COMPANIES] Erro:', error)
    }
  }, [searchQuery, userLocation, trackSearchResults])

  // Carregar resultados
  useEffect(() => {
    const loadResults = async () => {
      if (!searchQuery.trim()) {
        setLoading(false)
        return
      }

      setLoading(true)
      setProducts([])
      setCompanies([])
      setLastProductDoc(null)
      setLastCompanyDoc(null)

      // Track inicial da busca
      trackSearch(searchQuery, 0, {
        city: userLocation.city,
        state: userLocation.state,
        searchType,
        source: 'search_page'
      })

      if (searchType === 'all' || searchType === 'products') {
        await loadProducts(false)
      }
      
      if (searchType === 'all' || searchType === 'companies') {
        await loadCompanies(false)
      }

      setLoading(false)
    }

    loadResults()
  }, [searchQuery, searchType, trackSearch])

  // Scroll infinito
  useEffect(() => {
    const handleScroll = () => {
      if (loading || loadingMore) return

      const scrollTop = window.scrollY
      const windowHeight = window.innerHeight
      const docHeight = document.documentElement.scrollHeight

      if (scrollTop + windowHeight >= docHeight - 500) {
        if (searchType === 'products' && hasMoreProducts) {
          setLoadingMore(true)
          loadProducts(true).finally(() => setLoadingMore(false))
        } else if (searchType === 'companies' && hasMoreCompanies) {
          setLoadingMore(true)
          loadCompanies(true).finally(() => setLoadingMore(false))
        } else if (searchType === 'all') {
          if (hasMoreProducts || hasMoreCompanies) {
            setLoadingMore(true)
            Promise.all([
              hasMoreProducts ? loadProducts(true) : Promise.resolve(),
              hasMoreCompanies ? loadCompanies(true) : Promise.resolve()
            ]).finally(() => setLoadingMore(false))
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loading, loadingMore, searchType, hasMoreProducts, hasMoreCompanies, loadProducts, loadCompanies])

  const totalResults = products.length + companies.length

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-4">
              <Search className="h-8 w-8 text-coral-500" />
              <div className="flex-1">
                <h1 
                  data-testid="page-title" 
                  className="text-2xl font-bold text-gray-900"
                >
                  Resultados para: <span className="text-coral-500">"{searchQuery}"</span>
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                  <MapPin className="h-4 w-4" />
                  <span>{userLocation.city}, {userLocation.state}</span>
                </div>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSearchType('all')
                  trackFilterApplied('search_type', 'all')
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  searchType === 'all'
                    ? 'bg-coral-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todos ({totalResults})
              </button>
              <button
                onClick={() => {
                  setSearchType('products')
                  trackFilterApplied('search_type', 'products')
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  searchType === 'products'
                    ? 'bg-coral-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Package className="h-4 w-4" />
                Produtos ({products.length})
              </button>
              <button
                onClick={() => {
                  setSearchType('companies')
                  trackFilterApplied('search_type', 'companies')
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  searchType === 'companies'
                    ? 'bg-coral-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Building2 className="h-4 w-4" />
                Empresas ({companies.length})
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="container mx-auto px-4 py-8">
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-coral-500 border-t-transparent mx-auto"></div>
              <p className="mt-4 text-gray-600">Buscando...</p>
            </div>
          ) : totalResults === 0 ? (
            <div className="text-center py-20">
              <Search className="h-20 w-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Nenhum resultado encontrado</h3>
              <p className="text-gray-600">
                Tente buscar por outros termos ou verifique sua localização
              </p>
            </div>
          ) : (
            <>
              {/* Companies */}
              {(searchType === 'all' || searchType === 'companies') && companies.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Building2 className="h-6 w-6 text-coral-500" />
                    Empresas ({companies.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {companies.map(company => (
                      <CompanyCard key={company.id} company={company} />
                    ))}
                  </div>
                </div>
              )}

              {/* Products */}
              {(searchType === 'all' || searchType === 'products') && products.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Package className="h-6 w-6 text-coral-500" />
                    Produtos ({products.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map(product => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              )}

              {/* Loading more */}
              {loadingMore && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-coral-500 border-t-transparent mx-auto"></div>
                  <p className="mt-2 text-gray-600">Carregando mais resultados...</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}

// Componente principal com Suspense boundary
export default function SearchPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-coral-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando resultados da busca...</p>
          </div>
        </div>
      </Layout>
    }>
      <SearchPageContent />
    </Suspense>
  )
}

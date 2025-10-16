'use client'

import { useState, useEffect } from 'react'
import { useParams, notFound } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { db } from '@/lib/firebase'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Share2,
  Building2,
  Package
} from 'lucide-react'
import Link from 'next/link'
import { Product } from '@/types'
import { FavoriteCompanyButton } from '@/components/favorites/FavoriteCompanyButton'
import { CompanyProductCard } from '@/components/company/CompanyProductCard'
import { useCompanyAnalytics } from '@/hooks/useAnalytics'
import { CompanyUrlService } from '@/lib/company-url-service'

interface Company {
  id: string
  name: string
  about?: string
  email?: string
  phone?: string
  address?: string
  city: string
  state: string
  category?: string
  website?: string
  status: string
  logo?: string
  cover?: string
  latitude?: number
  longitude?: number
  createdAt: Date
}

export default function CompanyCustomUrlPage() {
  const params = useParams()
  const cityState = params.cityState as string
  const slug = params.slug as string
  
  const { trackCompanyView, trackCompanyShare, trackCompanyContact } = useCompanyAnalytics()
  
  const [company, setCompany] = useState<Company | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categoryName, setCategoryName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCustomUrl, setIsCustomUrl] = useState(true)

  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!cityState || !slug) return

      try {
        setLoading(true)

        // Validar e extrair parâmetros da URL
        const urlParams = CompanyUrlService.validateUrlParams(cityState, slug)
        if (!urlParams) {
          console.log('❌ Parâmetros de URL inválidos:', { cityState, slug })
          notFound()
          return
        }

        console.log('🔍 Buscando URL personalizada:', urlParams)

        // Buscar URL personalizada
        const companyUrl = await CompanyUrlService.getCompanyUrlBySlug(
          urlParams.slug,
          urlParams.city,
          urlParams.state
        )

        if (!companyUrl) {
          console.log('❌ URL personalizada não encontrada')
          notFound()
          return
        }

        console.log('✅ URL personalizada encontrada:', companyUrl)

        // Buscar dados da empresa usando o companyId da URL
        const companyRef = doc(db, 'companies', companyUrl.companyId)
        const companySnap = await getDoc(companyRef)
        
        if (!companySnap.exists()) {
          console.log('❌ Empresa não encontrada:', companyUrl.companyId)
          notFound()
          return
        }

        const companyData = {
          id: companySnap.id,
          ...companySnap.data(),
          createdAt: companySnap.data().createdAt?.toDate() || new Date()
        } as Company

        setCompany(companyData)

        // Track company view com indicação de URL personalizada
        trackCompanyView(companyData, 'custom-url')

        // Buscar nome da categoria se existir
        if (companyData.category) {
          try {
            console.log('🏷️ Buscando categoria:', companyData.category)
            const categoryRef = doc(db, 'company_category', companyData.category)
            const categorySnap = await getDoc(categoryRef)
            
            if (categorySnap.exists()) {
              const categoryData = categorySnap.data()
              setCategoryName(categoryData.name || companyData.category)
            } else {
              setCategoryName('Categoria Não Especificada')
            }
          } catch (err) {
            console.error('❌ Erro ao buscar categoria:', err)
            setCategoryName('Categoria Não Especificada')
          }
        }

        // Buscar produtos da empresa
        const productsRef = collection(db, 'product')
        const productsQuery = query(
          productsRef,
          where('companyOwner', '==', companyUrl.companyId),
          where('active', '==', 'SIM')
        )
        
        const productsSnap = await getDocs(productsQuery)
        const productsData = productsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date()
        })) as Product[]

        setProducts(productsData)

      } catch (err) {
        console.error('Erro ao carregar dados da empresa:', err)
        setError('Erro ao carregar dados da empresa')
      } finally {
        setLoading(false)
      }
    }

    fetchCompanyData()
  }, [cityState, slug])

  const handleShare = async () => {
    if (!company) return
    
    const currentUrl = window.location.href
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: company.name,
          text: `Conheça ${company.name} - ${company.about || 'Empresa parceira do XECO'}`,
          url: currentUrl
        })
        trackCompanyShare(company, 'native')
      } catch (error) {
        console.log('❌ Erro ao compartilhar:', error)
      }
    } else {
      await navigator.clipboard.writeText(currentUrl)
      trackCompanyShare(company, 'copy')
      // Aqui você pode mostrar uma notificação de "Link copiado!"
    }
  }

  const handleContact = (method: 'phone' | 'whatsapp' | 'email') => {
    if (!company) return
    trackCompanyContact(company, method)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {error || 'Empresa não encontrada'}
          </h1>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Início
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="relative">
        {/* Cover Image */}
        <div className="h-64 md:h-80 bg-gradient-to-br from-primary to-primary/80 relative overflow-hidden">
          {company.cover && (
            <div className="absolute inset-0">
              <img
                src={company.cover}
                alt={`Capa de ${company.name}`}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        {/* Company Info Section */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 pt-20 pb-6">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Company Info */}
              <div className="lg:col-span-2">
                <div className="text-center md:text-left mb-6">
                  {/* Category and Status */}
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                    {categoryName && (
                      <span className="bg-coral-100 text-coral-700 px-3 py-1 rounded-full text-sm font-medium">
                        {categoryName}
                      </span>
                    )}
                    {company.status === 'ativo' && (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                        ✓ Ativo
                      </span>
                    )}
                  </div>

                  {/* Company Logo and Name */}
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-4 mb-6">
                    {company.logo && (
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden bg-white shadow-lg flex-shrink-0">
                        <img
                          src={company.logo}
                          alt={`Logo de ${company.name}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="text-center md:text-left">
                      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                        {company.name}
                      </h1>
                      <div className="flex items-center justify-center md:justify-start text-gray-600 mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{company.city}, {company.state.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>

                  {/* About */}
                  {company.about && (
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                      <h2 className="font-semibold text-gray-900 mb-2">Sobre a Empresa</h2>
                      <p className="text-gray-700">{company.about}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-6">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                    <Building2 className="h-5 w-5 mr-2" />
                    Informações de Contato
                  </h3>

                  <div className="space-y-4">
                    {company.phone && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Telefone</label>
                        <a
                          href={`tel:${company.phone}`}
                          onClick={() => handleContact('phone')}
                          className="flex items-center text-gray-900 hover:text-primary transition-colors mt-1"
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          {company.phone}
                        </a>
                      </div>
                    )}

                    {company.email && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">E-mail</label>
                        <a
                          href={`mailto:${company.email}`}
                          onClick={() => handleContact('email')}
                          className="flex items-center text-gray-900 hover:text-primary transition-colors mt-1"
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          {company.email}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-6">
                    <FavoriteCompanyButton
                      companyId={company.id}
                      companyName={company.name}
                    />
                    <button
                      onClick={handleShare}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Compartilhar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        {products.length > 0 && (
          <div className="bg-white py-12">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                <Package className="h-6 w-6 mr-3" />
                Produtos e Serviços
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <CompanyProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* No Products Message */}
        {products.length === 0 && (
          <div className="bg-white py-12">
            <div className="container mx-auto px-4 text-center">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                Produtos em breve
              </h3>
              <p className="text-gray-500">
                Esta empresa ainda não cadastrou produtos na plataforma.
              </p>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
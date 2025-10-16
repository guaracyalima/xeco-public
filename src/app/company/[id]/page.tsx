'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
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

interface Company {
  id: string
  name: string
  about?: string
  email?: string
  phone?: string
  address?: string
  cidade: string
  uf: string
  category?: string
  website?: string
  status: string
  logo?: string
  cover?: string
  latitude?: number
  longitude?: number
  createdAt: Date
}

export default function CompanyDetailsPage() {
  const params = useParams()
  const companyId = params.id as string
  const { trackCompanyView, trackCompanyShare, trackCompanyContact } = useCompanyAnalytics()
  
  const [company, setCompany] = useState<Company | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categoryName, setCategoryName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!companyId) return

      try {
        setLoading(true)

        // Buscar dados da empresa
        const companyRef = doc(db, 'companies', companyId)
        const companySnap = await getDoc(companyRef)
        
        if (!companySnap.exists()) {
          setError('Empresa não encontrada')
          return
        }

        const companyData = {
          id: companySnap.id,
          ...companySnap.data(),
          createdAt: companySnap.data().createdAt?.toDate() || new Date()
        } as Company

        setCompany(companyData)

        // Track company view
        trackCompanyView(companyData, 'profile')

        // Buscar nome da categoria se existir
        if (companyData.category) {
          try {
            console.log('🏷️ Buscando categoria:', companyData.category)
            const categoryRef = doc(db, 'company_category', companyData.category)
            const categorySnap = await getDoc(categoryRef)
            
            console.log('📁 Category exists:', categorySnap.exists())
            if (categorySnap.exists()) {
              const categoryData = categorySnap.data()
              console.log('📋 Category data:', categoryData)
              setCategoryName(categoryData.name || companyData.category)
            } else {
              console.log('❌ Category not found, using friendly name')
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
          where('companyOwner', '==', companyId),
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
  }, [companyId])

  const handleShare = async () => {
    if (navigator.share && company) {
      try {
        await navigator.share({
          title: company.name,
          text: `Confira a empresa ${company.name} no Xeco!`,
          url: window.location.href,
        })
        // Track successful native share
        trackCompanyShare(company, 'native')
      } catch (err) {
        console.log('Erro ao compartilhar:', err)
      }
    } else if (company) {
      navigator.clipboard.writeText(window.location.href)
      // Track copy share
      trackCompanyShare(company, 'copy')
      alert('Link copiado para a área de transferência!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando empresa...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Empresa não encontrada
            </h1>
            <p className="text-gray-600 mb-6">
              {error || 'A empresa que você procura não existe ou foi removida.'}
            </p>
            <Link
              href="/"
              className="inline-block bg-coral-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-coral-600 transition-colors"
            >
              Voltar ao Início
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section with Cover Image */}
        <div className="relative">
          {/* Cover Image */}
          <div className="relative h-80 md:h-96 bg-gradient-to-r from-coral-500 to-coral-600">
            {company.cover ? (
              <img
                src={company.cover}
                alt={`Cover de ${company.name}`}
                className="w-full h-full object-cover"
              />
            ) : (
              // Default background pattern when no cover image
              <div className="w-full h-full bg-gradient-to-br from-coral-500 via-coral-600 to-orange-600 relative overflow-hidden">
                {/* Decorative pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-10 left-10 w-20 h-20 border-2 border-white rounded-full"></div>
                  <div className="absolute top-20 right-20 w-16 h-16 border-2 border-white rounded-full"></div>
                  <div className="absolute bottom-20 left-20 w-12 h-12 border-2 border-white rounded-full"></div>
                  <div className="absolute bottom-10 right-10 w-24 h-24 border-2 border-white rounded-full"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white rounded-full"></div>
                </div>
              </div>
            )}
            
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            
            {/* Company name overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white px-4">
                <h1 className="text-4xl md:text-6xl font-bold mb-2 drop-shadow-lg">
                  {company.name}
                </h1>
                <div className="flex items-center justify-center text-white/90 text-lg">
                  <MapPin className="h-5 w-5 mr-2" />
                  <span>{company.cidade}, {company.uf}</span>
                </div>
              </div>
            </div>

            {/* Back button */}
            <div className="absolute top-6 left-6">
              <Link
                href="/"
                className="inline-flex items-center text-white/90 hover:text-white bg-black/20 hover:bg-black/40 backdrop-blur-sm px-4 py-2 rounded-lg transition-all"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </div>

            {/* Share button */}
            <div className="absolute top-6 right-6">
              <button
                onClick={handleShare}
                className="p-3 text-white/90 hover:text-white bg-black/20 hover:bg-black/40 backdrop-blur-sm rounded-lg transition-all"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Company Logo - Positioned over cover */}
          {company.logo && (
            <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 md:left-1/2 md:-translate-x-1/2">
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
                <img
                  src={company.logo}
                  alt={`Logo de ${company.name}`}
                  className="w-full h-full object-cover"
                />
              </div>
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
                      <Link
                        href={`/empresas?categoria=${encodeURIComponent(company.category || '')}`}
                        className="bg-coral-100 text-coral-700 px-3 py-1 rounded-full text-sm font-medium hover:bg-coral-200 transition-colors cursor-pointer"
                      >
                        {categoryName}
                      </Link>
                    )}
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      ATIVO
                    </span>
                  </div>

                  {/* Company Name - Hidden on mobile since it's in hero */}
                  <h2 className="hidden md:block text-3xl font-bold text-gray-900 mb-4">
                    {company.name}
                  </h2>

                  {/* Contact Info Row */}
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-gray-600 mb-6">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{company.cidade}, {company.uf}</span>
                    </div>
                    
                    {company.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <a 
                          href={`tel:${company.phone}`}
                          className="text-coral-600 hover:text-coral-700 font-medium"
                          onClick={() => trackCompanyContact(company, 'phone')}
                        >
                          {company.phone}
                        </a>
                      </div>
                    )}

                    {company.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <a 
                          href={`mailto:${company.email}`}
                          className="text-coral-600 hover:text-coral-700 font-medium"
                          onClick={() => trackCompanyContact(company, 'email')}
                        >
                          {company.email}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* About Section */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-coral-500" />
                    Sobre a Empresa
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-coral-500">
                    {company.about && company.about.trim() !== '' ? (
                      <p className="text-gray-700 leading-relaxed">
                        {company.about}
                      </p>
                    ) : (
                      <div className="text-center py-4">
                        <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">
                          Descrição não disponível
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                          Esta empresa ainda não adicionou uma descrição sobre seus serviços.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

               
              </div>

              {/* Contact Sidebar */}
              <div className="space-y-6">
                {/* Main Action Button */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                
                  
                  <FavoriteCompanyButton
                    companyId={company.id}
                    companyName={company.name}
                    className="w-full"
                  />
                </div>

                {/* Contact Details */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Informações de Contato
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="font-medium text-gray-900">{company.cidade}, {company.uf}</div>
                        {company.address && (
                          <div className="text-sm text-gray-600 mt-1">{company.address}</div>
                        )}
                      </div>
                    </div>

                    {company.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-gray-400" />
                        <a 
                          href={`tel:${company.phone}`}
                          className="text-coral-600 hover:text-coral-700 font-medium"
                          onClick={() => trackCompanyContact(company, 'phone')}
                        >
                          {company.phone}
                        </a>
                      </div>
                    )}

                    {company.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <a 
                          href={`mailto:${company.email}`}
                          className="text-coral-600 hover:text-coral-700 font-medium"
                          onClick={() => trackCompanyContact(company, 'email')}
                        >
                          {company.email}
                        </a>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="font-medium text-green-600">Aberto</div>
                        <div className="text-sm text-gray-600">00:00 - 23:30</div>
                      </div>
                    </div>
                  </div>

                  {company.website && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-block text-center border border-coral-500 text-coral-600 px-4 py-2 rounded-lg font-medium hover:bg-coral-50 transition-colors"
                      >
                        🌐 Visitar Website
                      </a>
                    </div>
                  )}
                </div>

                {/* Map */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Localização
                  </h3>
                  
                  {company.latitude && company.longitude ? (
                    <div className="relative">
                      <iframe
                        src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dO2rSRuwrHFqAg&q=${company.latitude},${company.longitude}&zoom=15`}
                        width="100%"
                        height="200"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        className="rounded-lg"
                      ></iframe>
                      
                      <div className="mt-3">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${company.latitude},${company.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-coral-600 hover:text-coral-700 font-medium text-sm"
                        >
                          <MapPin className="h-4 w-4" />
                          Abrir no Google Maps
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-100 rounded-lg h-48 flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <MapPin className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">Localização não disponível</p>
                        <p className="text-xs mt-1">{company.cidade}, {company.uf}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Section - Step by Step Style */}
        <div className="container mx-auto px-4 py-12">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Produtos da Empresa
            </h2>
            <p className="text-gray-600">
              Explore todos os produtos disponíveis de {company.name}
            </p>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhum produto encontrado
              </h3>
              <p className="text-gray-600">
                Esta empresa ainda não possui produtos cadastrados.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <CompanyProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
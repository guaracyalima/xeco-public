'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'
import { 
  getAffiliatesByUserId, 
  getAffiliateSales, 
  calculateAffiliateStats,
  getCompanyById,
  getAffiliateCoupon
} from '@/services/affiliateService'
import { Affiliated, AffiliateSale, Company, Coupon } from '@/types'
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Copy, 
  Check,
  Calendar,
  Mail,
  Package,
  ChevronDown,
  ChevronUp,
  Building2
} from 'lucide-react'
import { toast } from 'react-toastify'

interface AffiliateWithSales {
  affiliate: Affiliated
  company: Company | null
  coupon: Coupon | null
  sales: AffiliateSale[]
  stats: ReturnType<typeof calculateAffiliateStats>
}

export function MyAffiliationTab() {
  const { userProfile } = useAuth()
  const [affiliatesData, setAffiliatesData] = useState<AffiliateWithSales[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedAffiliate, setExpandedAffiliate] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  useEffect(() => {
    async function loadAffiliatesData() {
      if (!userProfile?.uid) return

      try {
        setLoading(true)
        
        // Busca TODAS as afiliações do usuário
        const affiliates = await getAffiliatesByUserId(userProfile.uid)
        
        // Para cada afiliação, busca as vendas, empresa e cupom
        const affiliatesWithData = await Promise.all(
          affiliates.map(async (affiliate) => {
            const [sales, company, coupon] = await Promise.all([
              getAffiliateSales(affiliate.id),
              getCompanyById(affiliate.company_relationed),
              getAffiliateCoupon(affiliate.id, affiliate.company_relationed)
            ])
            const stats = calculateAffiliateStats(sales)
            
            return {
              affiliate,
              company,
              coupon,
              sales,
              stats
            }
          })
        )
        
        setAffiliatesData(affiliatesWithData)
        
        // Expande automaticamente se houver apenas uma afiliação
        if (affiliatesWithData.length === 1) {
          setExpandedAffiliate(affiliatesWithData[0].affiliate.id)
        }
      } catch (error) {
        console.error('Erro ao carregar dados de afiliações:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAffiliatesData()
  }, [userProfile])

  const handleCopyInviteCode = (inviteCode: string, affiliateId: string) => {
    navigator.clipboard.writeText(inviteCode)
    setCopiedCode(affiliateId)
    toast.success('Código de convite copiado!', {
      position: window.innerWidth < 768 ? 'top-center' : 'top-right',
      autoClose: 2000,
    })
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const toggleAffiliate = (affiliateId: string) => {
    setExpandedAffiliate(expandedAffiliate === affiliateId ? null : affiliateId)
  }

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dados de afiliação...</p>
        </div>
      </div>
    )
  }

  if (affiliatesData.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🤝</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Nenhuma afiliação ativa
          </h3>
          <p className="text-gray-600">
            Você ainda não tem nenhuma afiliação cadastrada.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Building2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">
              Você tem {affiliatesData.length} afiliação(ões) ativa(s)
            </h3>
            <p className="text-sm text-blue-700">
              Gerencie suas afiliações e acompanhe o desempenho de cada empresa
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Afiliações */}
      {affiliatesData.map(({ affiliate, company, coupon, sales, stats }) => {
        const isExpanded = expandedAffiliate === affiliate.id
        
        return (
          <div key={affiliate.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            {/* Header da Afiliação - Sempre visível */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-4 sm:p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3 flex-1">
                  {/* Logo da Empresa */}
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-white/50 shadow-lg flex-shrink-0">
                    {company?.logo ? (
                      <Image
                        src={company.logo}
                        alt={company.name}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Building2 className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-white truncate">
                      {company?.name || affiliate.name}
                    </h3>
                    <p className="text-white/90 text-xs sm:text-sm">
                      Comissão: {affiliate.commissionRate}%
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => toggleAffiliate(affiliate.id)}
                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors flex-shrink-0"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-white" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-white" />
                  )}
                </button>
              </div>
              
              {/* Código do Cupom */}
              {coupon && (
                <div className="flex items-center space-x-3">
                  <div className="flex-1 bg-white rounded-lg px-4 py-3 shadow-md">
                    <p className="text-xs text-gray-500 mb-1">Seu cupom:</p>
                    <p className="font-mono text-base sm:text-lg font-bold text-blue-600">
                      {coupon.code}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopyInviteCode(coupon.code, affiliate.id)}
                    className="flex items-center space-x-2 px-3 sm:px-4 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-50 transition-colors shadow-md"
                  >
                    {copiedCode === affiliate.id ? (
                      <>
                        <Check className="h-5 w-5" />
                        <span className="font-medium hidden sm:inline">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-5 w-5" />
                        <span className="font-medium hidden sm:inline">Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Conteúdo Expansível */}
            {isExpanded && (
              <div className="p-4 sm:p-6 space-y-6">
                {/* Cards de Estatísticas */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <Users className="h-4 sm:h-5 w-4 sm:w-5 text-blue-500" />
                      <span className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalSales}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">Total de Vendas</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <TrendingUp className="h-4 sm:h-5 w-4 sm:w-5 text-green-500" />
                      <span className="text-base sm:text-xl font-bold text-gray-900">
                        {formatPrice(stats.totalRevenue)}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">Receita Gerada</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <DollarSign className="h-4 sm:h-5 w-4 sm:w-5 text-yellow-500" />
                      <span className="text-base sm:text-xl font-bold text-gray-900">
                        {formatPrice(stats.totalCommissions)}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">Comissões Totais</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <Package className="h-4 sm:h-5 w-4 sm:w-5 text-purple-500" />
                      <span className="text-xl sm:text-2xl font-bold text-gray-900">{stats.confirmedSales}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">Vendas Confirmadas</p>
                  </div>
                </div>

                {/* Histórico de Vendas */}
                <div className="border border-gray-200 rounded-lg">
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <h4 className="font-semibold text-gray-900">Histórico de Vendas</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Vendas realizadas através do seu código
                    </p>
                  </div>

                  {sales.length === 0 ? (
                    <div className="p-8 sm:p-12 text-center">
                      <Users className="h-10 sm:h-12 w-10 sm:w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600">Nenhuma venda registrada ainda</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Compartilhe seu código para começar a ganhar comissões!
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {sales.map((sale) => (
                        <div key={sale.id} className="p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                <span className="text-sm font-medium text-gray-900 truncate">
                                  {sale.customerEmail}
                                </span>
                              </div>
                              {sale.couponUsed && (
                                <p className="text-xs text-gray-500">
                                  Cupom: <span className="font-mono font-medium">{sale.couponUsed}</span>
                                </p>
                              )}
                            </div>
                            <div className="text-right ml-4 flex-shrink-0">
                              <p className="text-sm font-semibold text-gray-900">
                                {formatPrice(sale.orderValue)}
                              </p>
                              <p className="text-xs text-green-600 font-medium">
                                +{formatPrice(sale.commissionValue)}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-3">
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(sale.saleDate)}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  sale.status === 'CONFIRMED'
                                    ? 'bg-green-100 text-green-700'
                                    : sale.status === 'PENDING'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {sale.status === 'CONFIRMED' ? 'Confirmado' : 
                                 sale.status === 'PENDING' ? 'Pendente' : 'Cancelado'}
                              </span>
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  sale.paymentStatus === 'PAID'
                                    ? 'bg-green-100 text-green-700'
                                    : sale.paymentStatus === 'PENDING'
                                    ? 'bg-gray-100 text-gray-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {sale.paymentStatus === 'PAID' ? 'Pago' : 
                                 sale.paymentStatus === 'PENDING' ? 'A pagar' : 'Falhou'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

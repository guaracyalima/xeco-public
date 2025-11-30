'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'
import { 
  getAffiliatesByUserId, 
  getAffiliateSales, 
  calculateAffiliateStats,
  getCompanyById,
  getAffiliateCoupon,
  getUserById
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
  Building2,
  Clock,
  X,
  Eye,
  CreditCard,
  User
} from 'lucide-react'
import { toast } from 'react-toastify'

interface AffiliateWithSales {
  affiliate: Affiliated
  company: Company | null
  coupon: Coupon | null
  sales: AffiliateSale[]
  pendingSales: AffiliateSale[]
  stats: ReturnType<typeof calculateAffiliateStats>
}

interface SaleWithCustomer extends AffiliateSale {
  customerName?: string
  products?: any[]
  itemsCount?: number
  paymentMethod?: string
  paidAt?: Date | null
}

export function MyAffiliationTab() {
  const { userProfile } = useAuth()
  const [affiliatesData, setAffiliatesData] = useState<AffiliateWithSales[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedAffiliate, setExpandedAffiliate] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [showPendingModal, setShowPendingModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedAffiliate, setSelectedAffiliate] = useState<AffiliateWithSales | null>(null)
  const [selectedSale, setSelectedSale] = useState<SaleWithCustomer | null>(null)
  const [salesWithCustomers, setSalesWithCustomers] = useState<Map<string, SaleWithCustomer>>(new Map())

  useEffect(() => {
    async function loadAffiliatesData() {
      if (!userProfile?.uid) return

      try {
        setLoading(true)
        
        // Busca TODAS as afiliações do usuário
        const affiliates = await getAffiliatesByUserId(userProfile.uid)
        
        // Para cada afiliação, busca as vendas confirmadas E pendentes, empresa e cupom
        const affiliatesWithData = await Promise.all(
          affiliates.map(async (affiliate) => {
            // Buscar TODAS as vendas de uma vez
            const [allSales, company, coupon] = await Promise.all([
              getAffiliateSales(affiliate.id, 'ALL'), // Buscar TODAS as vendas
              getCompanyById(affiliate.company_relationed),
              getAffiliateCoupon(affiliate.id, affiliate.company_relationed)
            ])
            
            // Separar em confirmed e pending no cliente
            const sales = allSales.filter(s => s.status === 'CONFIRMED')
            const pendingSales = allSales.filter(s => s.status === 'PENDING')
            
            // Buscar nomes dos clientes para TODAS as vendas
            const customerMap = new Map<string, SaleWithCustomer>()
            
            await Promise.all(
              allSales.map(async (sale) => {
                const customer = await getUserById(sale.customerEmail)
                if (sale.id) {
                  customerMap.set(sale.id, {
                    ...sale,
                    customerName: customer?.name || 'Cliente'
                  })
                }
              })
            )
            
            setSalesWithCustomers(prev => new Map([...prev, ...customerMap]))
            
            const stats = calculateAffiliateStats(sales)
            
            // DEBUG: Log dos dados do afiliado
            console.log('🔍 [MyAffiliationTab] Dados do afiliado:', {
              id: affiliate.id,
              name: affiliate.name,
              walletId: affiliate.walletId,
              walletSource: affiliate.walletSource,
              asaasAccountNumber: affiliate.asaasAccountNumber,
              asaasEnabled: affiliate.asaasEnabled,
              invite_code: affiliate.invite_code,
              coupon: coupon,
              confirmedSales: sales.length,
              pendingSales: pendingSales.length
            })
            
            return {
              affiliate,
              company,
              coupon,
              sales,
              pendingSales,
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

  const openPendingModal = (affiliateData: AffiliateWithSales) => {
    setSelectedAffiliate(affiliateData)
    setShowPendingModal(true)
  }

  const closePendingModal = () => {
    setShowPendingModal(false)
    setSelectedAffiliate(null)
  }

  const openSaleDetails = (sale: AffiliateSale) => {
    const saleWithCustomer = salesWithCustomers.get(sale.id || '') || sale
    setSelectedSale(saleWithCustomer as SaleWithCustomer)
    setShowDetailsModal(true)
  }

  const closeSaleDetails = () => {
    setShowDetailsModal(false)
    setSelectedSale(null)
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
      {affiliatesData.map(({ affiliate, company, coupon, sales, pendingSales, stats }) => {
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
              
              {/* Cupom de Desconto - SE EXISTIR */}
              {coupon ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 bg-white rounded-lg px-4 py-3 shadow-md">
                      <p className="text-xs text-gray-500 mb-1">
                        🎟️ Seu cupom de desconto:
                      </p>
                      <p className="font-mono text-base sm:text-lg font-bold text-blue-600">
                        {coupon.code}
                      </p>
                      {coupon.discountValue && (
                        <p className="text-xs text-green-600 mt-1 font-medium">
                          ✨ Desconto: {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `R$ ${coupon.discountValue.toFixed(2)}`}
                          {coupon.expiresAt && ` | Válido até ${new Date(coupon.expiresAt).toLocaleDateString('pt-BR')}`}
                        </p>
                      )}
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
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg px-3 py-3">
                    <p className="text-xs font-semibold text-blue-900 mb-2">
                      💡 Transforme seguidores em clientes!
                    </p>
                    <p className="text-xs text-blue-700 mb-2">
                      Compartilhe este cupom nas suas redes sociais, grupos do WhatsApp ou com amigos. Cada venda gera <strong>{affiliate.commissionRate}% de comissão</strong> pra você!
                    </p>
                    <div className="bg-white/60 rounded px-2 py-1.5 space-y-0.5 text-xs text-blue-800">
                      <p>📊 <strong>Desconto:</strong> {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `R$ ${coupon.discountValue.toFixed(2)}`}</p>
                      {coupon.minOrderValue && (
                        <p>💰 <strong>Pedido mínimo:</strong> R$ {coupon.minOrderValue.toFixed(2)}</p>
                      )}
                      {coupon.maxUses && (
                        <p>🎯 <strong>Usos:</strong> {coupon.usedCount || 0} de {coupon.maxUses} ({Math.round(((coupon.usedCount || 0) / coupon.maxUses) * 100)}%)</p>
                      )}
                      {coupon.expiresAt && (
                        <p>⏰ <strong>Válido até:</strong> {new Date(coupon.expiresAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
                  <p className="text-xs text-yellow-800">
                    ⏳ Cupom de desconto ainda não criado para esta empresa. Entre em contato com o administrador.
                  </p>
                </div>
              )}
            </div>

            {/* Conteúdo Expansível */}
            {isExpanded && (
              <div className="p-4 sm:p-6 space-y-6">
                {/* Aviso de Wallet Vazia - Precisa completar perfil */}
                {!affiliate.walletId && (
                  <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-red-800 mb-1">
                          ⚠️ Conta Asaas Não Configurada
                        </h4>
                        <p className="text-sm text-red-700">
                          Você ainda não possui uma conta Asaas configurada para receber comissões.
                        </p>
                        <p className="text-sm text-red-700 mt-2">
                          <strong>Complete seu perfil</strong> com os seguintes dados:
                        </p>
                        <ul className="text-sm text-red-700 mt-2 ml-4 list-disc">
                          <li>Nome completo</li>
                          <li>CPF ou CNPJ</li>
                          <li>Telefone</li>
                        </ul>
                        <button
                          onClick={() => window.location.href = '/profile'}
                          className="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Completar Perfil Agora
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Aviso de Wallet Compartilhada */}
                {affiliate.walletSource === 'company' && affiliate.ownCompanyId && company && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-yellow-800 mb-1 flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Conta Compartilhada com Franquia
                        </h4>
                        <p className="text-sm text-yellow-700">
                          ⚠️ Suas comissões desta afiliação estão sendo depositadas na conta digital da sua franquia <strong>"{company.name}"</strong>.
                        </p>
                        <p className="text-sm text-yellow-700 mt-2">
                          Como você já possui uma conta Asaas vinculada ao seu CPF/CNPJ através da sua empresa, por limitações da Asaas, só é permitida uma conta por documento.
                        </p>
                        <p className="text-sm font-semibold text-yellow-800 mt-2">
                          💰 Verifique o extrato da sua empresa para acompanhar as comissões recebidas.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Informações da Conta Asaas - quando tiver walletId */}
                {affiliate.walletId && affiliate.walletSource !== 'company' && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-green-900">
                          💰 Conta Asaas Ativa
                        </h4>
                        <p className="text-xs text-green-700">
                          Suas comissões serão depositadas aqui
                        </p>
                      </div>
                    </div>

                    {/* Dados da conta bancária - SEMPRE MOSTRAR SE EXISTIR */}
                    <div className="bg-white rounded-lg p-3 mb-3">
                      {affiliate.asaasAccountNumber && 
                       affiliate.asaasAccountNumber.agency !== undefined && 
                       affiliate.asaasAccountNumber.account !== undefined ? (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-gray-500">Agência</p>
                            <p className="font-mono text-base font-bold text-gray-900">
                              {affiliate.asaasAccountNumber.agency}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Conta</p>
                            <p className="font-mono text-base font-bold text-gray-900">
                              {affiliate.asaasAccountNumber.account}-{affiliate.asaasAccountNumber.accountDigit}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-xs text-gray-500">Conta configurada</p>
                          <p className="text-sm text-gray-700 mb-2">
                            Dados bancários serão atualizados em breve
                          </p>
                          <p className="text-xs text-red-500">
                            DEBUG: {JSON.stringify(affiliate.asaasAccountNumber)}
                          </p>
                        </>
                      )}
                    </div>

                    {/* Instruções do App */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs font-medium text-blue-900 mb-2">
                        📱 Use o App Asaas para gerenciar
                      </p>
                      <div className="flex gap-2">
                        <a
                          href="https://play.google.com/store/apps/details?id=com.asaas.app"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                          </svg>
                          <span className="hidden sm:inline">Google Play</span>
                          <span className="sm:hidden">Play</span>
                        </a>
                        <a
                          href="https://apps.apple.com/br/app/asaas/id1445791594"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
                          </svg>
                          <span className="hidden sm:inline">App Store</span>
                          <span className="sm:hidden">iOS</span>
                        </a>
                      </div>
                    </div>
                  </div>
                )}

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
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">Histórico de Vendas</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Vendas realizadas através do seu código
                        </p>
                      </div>
                      {pendingSales.length > 0 && (
                        <button
                          onClick={() => openPendingModal({ affiliate, company, coupon, sales, pendingSales, stats })}
                          className="flex items-center gap-2 px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors text-sm font-medium"
                        >
                          <Clock className="h-4 w-4" />
                          <span className="hidden sm:inline">{pendingSales.length} Pendente{pendingSales.length !== 1 ? 's' : ''}</span>
                          <span className="sm:hidden">{pendingSales.length}</span>
                        </button>
                      )}
                    </div>
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
                      {sales.map((sale) => {
                        const saleWithCustomer = salesWithCustomers.get(sale.id || '') || sale
                        return (
                          <button
                            key={sale.id}
                            onClick={() => openSaleDetails(sale)}
                            className="w-full p-3 sm:p-4 hover:bg-gray-50 transition-colors text-left group cursor-pointer"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <User className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                  <span className="text-sm font-medium text-gray-900 truncate">
                                    {(saleWithCustomer as SaleWithCustomer).customerName || 'Carregando...'}
                                  </span>
                                  <Eye className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
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
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                                  Confirmado
                                </span>
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                                  Pago
                                </span>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Modal de Vendas Pendentes */}
      {showPendingModal && selectedAffiliate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-xl">
            {/* Header do Modal */}
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-6 w-6 text-white" />
                  <div>
                    <h3 className="text-lg font-bold text-white">Vendas Pendentes</h3>
                    <p className="text-white/90 text-sm">
                      {selectedAffiliate.company?.name || selectedAffiliate.affiliate.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closePendingModal}
                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh]">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg mb-4">
                <p className="text-sm text-yellow-800">
                  ⏳ <strong>{selectedAffiliate.pendingSales.length} venda{selectedAffiliate.pendingSales.length !== 1 ? 's' : ''} aguardando</strong> confirmação de pagamento. 
                  Assim que o pagamento for confirmado, {selectedAffiliate.pendingSales.length !== 1 ? 'elas' : 'ela'} aparecerá{selectedAffiliate.pendingSales.length !== 1 ? 'm' : ''} no histórico principal.
                </p>
              </div>

              {selectedAffiliate.pendingSales.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">Nenhuma venda pendente</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedAffiliate.pendingSales.map((sale) => {
                    const saleWithCustomer = salesWithCustomers.get(sale.id || '') || sale
                    return (
                      <button
                        key={sale.id}
                        onClick={() => openSaleDetails(sale)}
                        className="w-full border border-yellow-200 bg-yellow-50/50 rounded-lg p-4 hover:bg-yellow-50 transition-colors text-left group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <User className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                              <span className="text-sm font-medium text-gray-900 truncate">
                                {(saleWithCustomer as SaleWithCustomer).customerName || 'Carregando...'}
                              </span>
                              <Eye className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
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
                            <p className="text-xs font-medium text-orange-500 opacity-70 line-through decoration-2">
                              +{formatPrice(sale.commissionValue)}
                            </p>
                            <p className="text-xs text-orange-600 font-semibold">
                              ⏳ Escapando...
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-3 pt-3 border-t border-yellow-200">
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(sale.saleDate)}</span>
                          </div>
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700 w-fit">
                            Aguardando Pagamento
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer do Modal */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <button
                onClick={closePendingModal}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes da Venda */}
      {showDetailsModal && selectedSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-xl">
            {/* Header do Modal */}
            <div className={`p-4 sm:p-6 ${selectedSale.status === 'PENDING' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-green-500 to-emerald-500'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="h-6 w-6 text-white" />
                  <div>
                    <h3 className="text-lg font-bold text-white">Detalhes da Venda</h3>
                    <p className="text-white/90 text-sm">
                      {selectedSale.orderId}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeSaleDetails}
                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh]">
              {/* Informações do Cliente */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-900">Cliente</h4>
                </div>
                <p className="text-sm text-blue-800">
                  <strong>{selectedSale.customerName || 'Cliente'}</strong>
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  ID: {selectedSale.customerEmail}
                </p>
              </div>

              {/* Valores */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">Valor da Venda</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatPrice(selectedSale.orderValue)}
                  </p>
                </div>
                <div className={`rounded-lg p-4 border ${selectedSale.status === 'PENDING' ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
                  <p className={`text-xs mb-1 ${selectedSale.status === 'PENDING' ? 'text-orange-600' : 'text-green-600'}`}>
                    Sua Comissão ({selectedSale.commissionRate.toFixed(1)}%)
                  </p>
                  {selectedSale.status === 'PENDING' ? (
                    <>
                      <p className="text-lg font-bold text-orange-500 line-through opacity-70">
                        {formatPrice(selectedSale.commissionValue)}
                      </p>
                      <p className="text-xs text-orange-600 font-semibold mt-1">
                        ⏳ Escapando entre os dedos...
                      </p>
                    </>
                  ) : (
                    <p className="text-lg font-bold text-green-600">
                      +{formatPrice(selectedSale.commissionValue)}
                    </p>
                  )}
                </div>
              </div>

              {/* Cupom */}
              {selectedSale.couponUsed && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🎟️</span>
                    <h4 className="font-semibold text-purple-900">Cupom Utilizado</h4>
                  </div>
                  <p className="font-mono text-base font-bold text-purple-600">
                    {selectedSale.couponUsed}
                  </p>
                </div>
              )}

              {/* Produtos */}
              {selectedSale.products && selectedSale.products.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Package className="h-5 w-5 text-gray-600" />
                    Produtos ({selectedSale.itemsCount})
                  </h4>
                  <div className="space-y-2">
                    {selectedSale.products.map((product: any, index: number) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Produto {product.productId}
                          </p>
                          <p className="text-xs text-gray-600">
                            Quantidade: {product.quantity}x
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            {formatPrice(product.total || (product.unitPrice * product.quantity))}
                          </p>
                          <p className="text-xs text-gray-600">
                            {formatPrice(product.unitPrice)}/un
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Datas e Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <p className="text-xs text-gray-600">Data da Venda</p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(selectedSale.saleDate)}
                  </p>
                </div>
                {selectedSale.paidAt && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="h-4 w-4 text-gray-600" />
                      <p className="text-xs text-gray-600">Pagamento</p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(selectedSale.paidAt)}
                    </p>
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div className="mt-4 flex items-center justify-center gap-3">
                <span className={`px-4 py-2 text-sm font-semibold rounded-full ${selectedSale.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                  {selectedSale.status === 'PENDING' ? '⏳ Aguardando Pagamento' : '✅ Pagamento Confirmado'}
                </span>
              </div>
            </div>

            {/* Footer do Modal */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <button
                onClick={closeSaleDetails}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

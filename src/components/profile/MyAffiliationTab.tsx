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
            
            // DEBUG: Log dos dados do afiliado
            console.log('🔍 [MyAffiliationTab] Dados do afiliado:', {
              id: affiliate.id,
              name: affiliate.name,
              walletId: affiliate.walletId,
              walletSource: affiliate.walletSource,
              asaasAccountNumber: affiliate.asaasAccountNumber,
              asaasEnabled: affiliate.asaasEnabled,
              invite_code: affiliate.invite_code,
              coupon: coupon
            })
            
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
                          onClick={() => window.location.href = '/perfil'}
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

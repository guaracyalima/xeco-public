import { 
  collection, 
  doc, 
  getDoc, 
  getDocs,
  query, 
  where,
  orderBy,
  limit
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Affiliated, AffiliateSale, Company, Coupon } from '@/types'

/**
 * Busca TODOS os dados de afiliação pelo userId (pode ter múltiplas empresas)
 */
export async function getAffiliatesByUserId(userId: string): Promise<Affiliated[]> {
  try {
    console.log('🔍 [AffiliateService] Buscando afiliações para userId:', userId)
    
    const affiliatedRef = collection(db, 'affiliated')
    const q = query(affiliatedRef, where('user', '==', userId))
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      console.log('ℹ️ [AffiliateService] Nenhuma afiliação encontrada')
      return []
    }
    
    const affiliates: Affiliated[] = querySnapshot.docs.map(affiliateDoc => {
      const data = affiliateDoc.data()
      
      return {
        id: affiliateDoc.id,
        user: data.user,
        walletId: data.walletId || '',
        walletSource: data.walletSource,
        ownCompanyId: data.ownCompanyId,
        invite_code: data.invite_code,
        active: data.active,
        company_relationed: data.company_relationed,
        email: data.email,
        whatsapp: data.whatsapp || '',
        name: data.name,
        commissionRate: data.commissionRate || 0,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        // Dados da conta Asaas
        asaasEnabled: data.asaasEnabled,
        asaasAccountStatus: data.asaasAccountStatus,
        asaasAccountId: data.asaasAccountId,
        asaasApiKey: data.asaasApiKey,
        asaasAccountNumber: data.asaasAccountNumber
      }
    })
    
    console.log(`✅ [AffiliateService] ${affiliates.length} afiliação(ões) encontrada(s)`)
    return affiliates
  } catch (error) {
    console.error('❌ [AffiliateService] Erro ao buscar afiliações:', error)
    return []
  }
}

/**
 * Busca dados do afiliado pelo userId (DEPRECATED - usar getAffiliatesByUserId)
 * Mantido para compatibilidade - retorna primeira afiliação encontrada
 */
export async function getAffiliateByUserId(userId: string): Promise<Affiliated | null> {
  try {
    const affiliates = await getAffiliatesByUserId(userId)
    return affiliates.length > 0 ? affiliates[0] : null
  } catch (error) {
    console.error('❌ [AffiliateService] Erro ao buscar afiliado:', error)
    return null
  }
}

/**
 * Busca todas as vendas (sales) do afiliado
 */
export async function getAffiliateSales(affiliateId: string): Promise<AffiliateSale[]> {
  try {
    console.log('🔍 [AffiliateService] Buscando vendas do afiliado:', affiliateId)
    
    const salesRef = collection(db, 'affiliate_sales')
    const q = query(
      salesRef, 
      where('affiliateId', '==', affiliateId),
      orderBy('saleDate', 'desc'),
      limit(100)
    )
    
    const querySnapshot = await getDocs(q)
    
    const sales: AffiliateSale[] = querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        affiliateId: data.affiliateId,
        storeId: data.storeId,
        orderId: data.orderId,
        customerEmail: data.customerEmail,
        orderValue: data.orderValue || 0,
        commissionValue: data.commissionValue || 0,
        commissionRate: data.commissionRate || 0,
        couponUsed: data.couponUsed,
        clickId: data.clickId,
        saleDate: data.saleDate?.toDate() || new Date(),
        status: data.status || 'PENDING',
        paymentStatus: data.paymentStatus || 'PENDING',
        createdAt: data.createdAt?.toDate() || new Date()
      }
    })
    
    console.log(`✅ [AffiliateService] ${sales.length} vendas encontradas`)
    return sales
  } catch (error) {
    console.error('❌ [AffiliateService] Erro ao buscar vendas:', error)
    return []
  }
}

/**
 * Calcula estatísticas do afiliado
 */
export function calculateAffiliateStats(sales: AffiliateSale[]) {
  const totalSales = sales.length
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.orderValue, 0)
  const totalCommissions = sales.reduce((sum, sale) => sum + sale.commissionValue, 0)
  
  const confirmedSales = sales.filter(s => s.status === 'CONFIRMED')
  const pendingSales = sales.filter(s => s.status === 'PENDING')
  const cancelledSales = sales.filter(s => s.status === 'CANCELLED')
  
  const paidCommissions = sales
    .filter(s => s.paymentStatus === 'PAID')
    .reduce((sum, sale) => sum + sale.commissionValue, 0)
  
  const pendingCommissions = sales
    .filter(s => s.paymentStatus === 'PENDING')
    .reduce((sum, sale) => sum + sale.commissionValue, 0)
  
  return {
    totalSales,
    totalRevenue,
    totalCommissions,
    confirmedSales: confirmedSales.length,
    pendingSales: pendingSales.length,
    cancelledSales: cancelledSales.length,
    paidCommissions,
    pendingCommissions
  }
}

/**
 * Busca dados da empresa por ID
 */
export async function getCompanyById(companyId: string): Promise<Company | null> {
  try {
    console.log('🔍 [AffiliateService] Buscando empresa:', companyId)
    
    const companyRef = doc(db, 'companies', companyId)
    const companyDoc = await getDoc(companyRef)
    
    if (!companyDoc.exists()) {
      console.log('ℹ️ [AffiliateService] Empresa não encontrada')
      return null
    }
    
    const data = companyDoc.data()
    
    const company: Company = {
      id: companyDoc.id,
      name: data.name,
      about: data.about || '',
      logo: data.logo,
      phone: data.phone || '',
      whatsapp: data.whatsapp || '',
      city: data.city || '',
      state: data.state || '',
      categoryId: data.categoryId || '',
      status: data.status || false,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    }
    
    console.log('✅ [AffiliateService] Empresa encontrada:', company.name)
    return company
  } catch (error) {
    console.error('❌ [AffiliateService] Erro ao buscar empresa:', error)
    return null
  }
}

/**
 * Busca cupom do afiliado para uma empresa específica
 */
export async function getAffiliateCoupon(affiliateId: string, companyId: string): Promise<Coupon | null> {
  try {
    console.log('🔍 [AffiliateService] Buscando cupom do afiliado:', affiliateId, 'para empresa:', companyId)
    
    const couponsRef = collection(db, 'coupons')
    const q = query(
      couponsRef, 
      where('affiliateId', '==', affiliateId),
      where('companyId', '==', companyId),
      where('isActive', '==', true),
      limit(1)
    )
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      console.log('ℹ️ [AffiliateService] Nenhum cupom encontrado')
      return null
    }
    
    const couponDoc = querySnapshot.docs[0]
    const data = couponDoc.data()
    
    const coupon: Coupon = {
      id: couponDoc.id,
      code: data.code,
      companyId: data.companyId,
      affiliateId: data.affiliateId,
      type: data.type,
      discountType: data.discountType,
      discountValue: data.discountValue,
      isActive: data.isActive,
      maxUses: data.maxUses,
      usedCount: data.usedCount || 0,
      minOrderValue: data.minOrderValue,
      expiresAt: data.expiresAt?.toDate() || null,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    }
    
    console.log('✅ [AffiliateService] Cupom encontrado:', coupon.code)
    return coupon
  } catch (error) {
    console.error('❌ [AffiliateService] Erro ao buscar cupom:', error)
    return null
  }
}

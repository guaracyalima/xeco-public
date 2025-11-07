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
 * Converte uma data do Firestore para Date
 * Aceita: Timestamp, string ISO, ou Date
 */
function parseFirestoreDate(value: any): Date {
  if (!value) return new Date()
  
  // Se já é Date, retorna
  if (value instanceof Date) return value
  
  // Se é Timestamp do Firestore (tem método toDate)
  if (value && typeof value.toDate === 'function') {
    return value.toDate()
  }
  
  // Se é string (ISO), converte
  if (typeof value === 'string') {
    return new Date(value)
  }
  
  // Fallback
  return new Date()
}

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
        createdAt: parseFirestoreDate(data.createdAt),
        updatedAt: parseFirestoreDate(data.updatedAt),
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
 * Busca de DUAS fontes: collection 'sales' E collection 'orders'
 * Evita duplicatas usando orderId como chave única
 */
export async function getAffiliateSales(affiliateId: string, statusFilter: 'CONFIRMED' | 'PENDING' | 'ALL' = 'ALL'): Promise<AffiliateSale[]> {
  try {
    console.log('🔍 [AffiliateService] Buscando vendas do afiliado:', affiliateId, 'com filtro:', statusFilter)
    
    // 🔥 BUSCAR DADOS DO AFILIADO PARA PEGAR commissionRate CORRETO
    let affiliateCommissionRate = 5 // Padrão fallback
    try {
      const affiliateDoc = await getDoc(doc(db, 'affiliated', affiliateId))
      if (affiliateDoc.exists()) {
        affiliateCommissionRate = affiliateDoc.data()?.commissionRate || 5
        console.log(`📊 [AffiliateService] Commission rate do afiliado: ${affiliateCommissionRate}%`)
      }
    } catch (error) {
      console.warn('⚠️ [AffiliateService] Erro ao buscar commissionRate do afiliado, usando 5% padrão', error)
    }
    
    // 1️⃣ BUSCAR DA COLLECTION SALES
    const salesRef = collection(db, 'sales')
    let salesQuery = query(
      salesRef, 
      where('affiliateId', '==', affiliateId),
      orderBy('saleDate', 'desc'),
      limit(100)
    )
    
    if (statusFilter === 'CONFIRMED') {
      salesQuery = query(
        salesRef, 
        where('affiliateId', '==', affiliateId),
        where('paymentStatus', '==', 'CONFIRMED'),
        orderBy('saleDate', 'desc'),
        limit(100)
      )
    } else if (statusFilter === 'PENDING') {
      salesQuery = query(
        salesRef, 
        where('affiliateId', '==', affiliateId),
        where('paymentStatus', '==', 'PENDING'),
        orderBy('saleDate', 'desc'),
        limit(100)
      )
    }
    
    const salesSnapshot = await getDocs(salesQuery)
    console.log(`📊 [AffiliateService] ${salesSnapshot.docs.length} vendas encontradas na collection 'sales'`)
    
    // 2️⃣ BUSCAR DA COLLECTION ORDERS (pedidos com afiliado)
    const ordersRef = collection(db, 'orders')
    let ordersQuery = query(
      ordersRef,
      where('affiliateId', '==', affiliateId),
      where('paymentStatus', '==', 'CONFIRMED'), // Apenas pedidos confirmados
      orderBy('createdAt', 'desc'),
      limit(100)
    )
    
    const ordersSnapshot = await getDocs(ordersQuery)
    console.log(`📦 [AffiliateService] ${ordersSnapshot.docs.length} pedidos encontrados na collection 'orders'`)
    
    // 3️⃣ MAPEAR VENDAS DA COLLECTION SALES
    const salesMap = new Map<string, AffiliateSale>()
    
    salesSnapshot.docs.forEach(doc => {
      const data = doc.data()
      const sale: AffiliateSale = {
        id: doc.id,
        affiliateId: data.affiliateId,
        storeId: data.companyId,
        orderId: data.orderId,
        customerEmail: data.userId,
        orderValue: data.grossValue || 0,
        commissionValue: data.affiliateCommission || 0,
        commissionRate: data.affiliateCommission ? (data.affiliateCommission / data.grossValue * 100) : 0,
        couponUsed: data.couponCode || data.affiliateCouponCode || '',
        clickId: data.clickId,
        saleDate: parseFirestoreDate(data.saleDate),
        status: data.paymentStatus === 'CONFIRMED' || data.paymentStatus === 'RECEIVED' ? 'CONFIRMED' : 'PENDING',
        paymentStatus: data.paymentStatus === 'RECEIVED' ? 'PAID' : 'PENDING',
        createdAt: parseFirestoreDate(data.createdAt),
        products: data.products || [],
        itemsCount: data.itemsCount || 0,
        paymentMethod: data.paymentMethod,
        paidAt: data.paidAt ? parseFirestoreDate(data.paidAt) : null
      }
      
      // Usar orderId como chave única para evitar duplicatas
      if (data.orderId) {
        salesMap.set(data.orderId, sale)
      }
    })
    
    // 4️⃣ ADICIONAR VENDAS DA COLLECTION ORDERS (se não existir em sales)
    ordersSnapshot.docs.forEach(doc => {
      const data = doc.data()
      const orderId = doc.id
      
      // ⚠️ Só adicionar se NÃO existir em sales (evitar duplicata)
      if (!salesMap.has(orderId)) {
        console.log(`➕ [AffiliateService] Adicionando order ${orderId} que não está em sales`)
        
        // Calcular comissão usando commissionRate real do afiliado
        const grossValue = data.totalAmount || 0
        const affiliateCommission = grossValue * (affiliateCommissionRate / 100)
        
        const sale: AffiliateSale = {
          id: doc.id,
          affiliateId: data.affiliateId,
          storeId: data.companyId,
          orderId: orderId,
          customerEmail: data.userId,
          orderValue: grossValue,
          commissionValue: affiliateCommission,
          commissionRate: affiliateCommissionRate, // ← Usando taxa real do afiliado
          couponUsed: data.couponCode || '',
          clickId: undefined,
          saleDate: parseFirestoreDate(data.createdAt),
          status: 'CONFIRMED',
          paymentStatus: data.paymentStatus === 'CONFIRMED' ? 'PAID' : 'PENDING',
          createdAt: parseFirestoreDate(data.createdAt)
        }
        
        salesMap.set(orderId, sale)
      }
    })
    
    // 5️⃣ CONVERTER MAP PARA ARRAY E ORDENAR
    const allSales = Array.from(salesMap.values()).sort((a, b) => {
      return b.saleDate.getTime() - a.saleDate.getTime()
    })
    
    // 6️⃣ FILTRAR POR STATUS SE NECESSÁRIO
    let filteredSales = allSales
    if (statusFilter === 'CONFIRMED') {
      filteredSales = allSales.filter(s => s.status === 'CONFIRMED')
    } else if (statusFilter === 'PENDING') {
      filteredSales = allSales.filter(s => s.status === 'PENDING')
    }
    
    console.log(`✅ [AffiliateService] ${filteredSales.length} vendas únicas encontradas (filtro: ${statusFilter})`)
    console.log(`📊 [AffiliateService] Fontes: ${salesSnapshot.docs.length} de sales + ${ordersSnapshot.docs.length - (allSales.length - salesSnapshot.docs.length)} de orders`)
    
    return filteredSales
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
      createdAt: parseFirestoreDate(data.createdAt),
      updatedAt: parseFirestoreDate(data.updatedAt)
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

/**
 * Busca dados do usuário/cliente por ID
 */
export async function getUserById(userId: string): Promise<{ name: string; email: string } | null> {
  try {
    console.log('🔍 [AffiliateService] Buscando usuário:', userId)
    
    const userRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userRef)
    
    if (!userDoc.exists()) {
      console.log('ℹ️ [AffiliateService] Usuário não encontrado')
      return null
    }
    
    const data = userDoc.data()
    
    return {
      name: data.name || data.displayName || 'Cliente',
      email: data.email || ''
    }
  } catch (error) {
    console.error('❌ [AffiliateService] Erro ao buscar usuário:', error)
    return null
  }
}

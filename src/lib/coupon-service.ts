import { 
  collection, 
  doc, 
  getDoc, 
  getDocs,
  query, 
  where, 
  updateDoc,
  increment
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Coupon, CouponValidationResult, Affiliated, CartDiscount } from '@/types'

// Validate and apply coupon
export const validateCoupon = async (
  couponCode: string, 
  companyId: string, 
  cartTotal: number
): Promise<CouponValidationResult> => {
  try {
    console.log('🎫 ========== VALIDAÇÃO DE CUPOM ==========')
    console.log('📋 Código do cupom:', couponCode.toUpperCase())
    console.log('🏪 Company ID:', companyId)
    console.log('💰 Valor do carrinho:', cartTotal)
    
    // 1. Find coupon by code
    const couponsRef = collection(db, 'coupons')
    const q = query(couponsRef, where('code', '==', couponCode.toUpperCase()))
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      console.log('❌ Cupom não encontrado no banco de dados')
      return {
        valid: false,
        message: 'Cupom não encontrado. Verifique o código e tente novamente.'
      }
    }
    
    const couponDoc = querySnapshot.docs[0]
    const couponData = couponDoc.data()
    console.log('📦 Dados do cupom encontrado:', couponData)
    
    const coupon = {
      id: couponDoc.id,
      ...couponData,
      expiresAt: couponData.expiresAt?.toDate() || null,
      createdAt: couponData.createdAt?.toDate(),
      updatedAt: couponData.updatedAt?.toDate(),
      emailSentAt: couponData.emailSentAt
    } as Coupon
    
    // 2. Validate coupon status (isActive)
    console.log('🔍 Verificando se cupom está ativo:', coupon.isActive)
    if (!coupon.isActive) {
      console.log('❌ Cupom não está ativo (isActive = false)')
      return {
        valid: false,
        message: 'Este cupom não está mais válido.'
      }
    }
    console.log('✅ Cupom está ativo')
    
    // 3. Check expiration (expiresAt)
    if (coupon.expiresAt) {
      const now = new Date()
      const expirationDate = coupon.expiresAt
      console.log('🔍 Verificando expiração:')
      console.log('   Data atual:', now.toISOString())
      console.log('   Data expiração:', expirationDate.toISOString())
      
      if (expirationDate < now) {
        console.log('❌ Cupom expirado')
        return {
          valid: false,
          message: `Este cupom expirou em ${expirationDate.toLocaleDateString('pt-BR')}.`
        }
      }
      console.log('✅ Cupom ainda não expirou')
    } else {
      console.log('ℹ️ Cupom sem data de expiração (válido indefinidamente)')
    }
    
    // 4. Check usage limit (maxUses)
    if (coupon.maxUses !== null && coupon.maxUses !== undefined) {
      const usedCount = coupon.usedCount || 0
      console.log('🔍 Verificando limite de uso:')
      console.log('   Vezes usado:', usedCount)
      console.log('   Limite máximo:', coupon.maxUses)
      
      if (usedCount >= coupon.maxUses) {
        console.log('❌ Cupom atingiu limite de uso')
        return {
          valid: false,
          message: `Este cupom atingiu o limite de ${coupon.maxUses} uso(s).`
        }
      }
      console.log(`✅ Cupom ainda tem ${coupon.maxUses - usedCount} uso(s) disponível(is)`)
    } else {
      console.log('ℹ️ Cupom sem limite de uso')
    }
    
    // 5. Check company match
    console.log('🔍 Verificando se cupom é válido para a empresa:')
    console.log('   Company do cupom:', coupon.companyId)
    console.log('   Company do carrinho:', companyId)
    
    if (coupon.companyId !== companyId) {
      console.log('❌ Cupom não é válido para esta empresa')
      return {
        valid: false,
        message: 'Este cupom não é válido para os produtos em seu carrinho.'
      }
    }
    console.log('✅ Cupom válido para esta empresa')
    
    // 6. Check minimum order value (minOrderValue)
    if (coupon.minOrderValue !== null && coupon.minOrderValue !== undefined && coupon.minOrderValue > 0) {
      console.log('🔍 Verificando valor mínimo do pedido:')
      console.log('   Valor do carrinho:', cartTotal)
      console.log('   Valor mínimo:', coupon.minOrderValue)
      
      if (cartTotal < coupon.minOrderValue) {
        console.log('❌ Valor do carrinho abaixo do mínimo')
        return {
          valid: false,
          message: `Valor mínimo de R$ ${coupon.minOrderValue.toFixed(2)} não atingido. Adicione mais R$ ${(coupon.minOrderValue - cartTotal).toFixed(2)} para usar este cupom.`
        }
      }
      console.log('✅ Valor do carrinho atende ao mínimo')
    } else {
      console.log('ℹ️ Cupom sem valor mínimo de pedido')
    }
    
    // 7. If it's an affiliate coupon, validate affiliate
    let affiliate: Affiliated | undefined
    console.log('🔍 Verificando se é cupom de afiliado:')
    console.log('   Tipo do cupom:', coupon.type)
    console.log('   AffiliateId:', coupon.affiliateId)
    
    // Se tem affiliateId, é cupom de afiliado (independente do campo type)
    if (coupon.affiliateId) {
      console.log('🔍 Validando afiliado:', coupon.affiliateId)
      const affiliateResult = await validateAffiliate(coupon.affiliateId, companyId)
      if (!affiliateResult.valid) {
        console.log('❌ Validação do afiliado falhou')
        return {
          valid: false,
          message: affiliateResult.message || 'O afiliado associado a este cupom não está mais ativo.'
        }
      }
      affiliate = affiliateResult.affiliate
      console.log('✅ Afiliado válido:', affiliate?.name)
    } else {
      console.log('ℹ️ Cupom não é de afiliado (sem affiliateId)')
    }
    
    // 8. Calculate discount
    console.log('💰 Calculando desconto:')
    console.log('   Tipo:', coupon.discountType)
    console.log('   Valor:', coupon.discountValue)
    
    const discountAmount = calculateDiscount(coupon, cartTotal)
    console.log('   Desconto calculado: R$', discountAmount.toFixed(2))
    console.log('   Valor final: R$', (cartTotal - discountAmount).toFixed(2))
    
    console.log('✅ ========== CUPOM VÁLIDO ==========')
    
    return {
      valid: true,
      message: 'Cupom aplicado com sucesso!',
      coupon,
      affiliate,
      discountAmount
    }
    
  } catch (error) {
    console.error('❌ Erro ao validar cupom:', error)
    return {
      valid: false,
      message: 'Erro ao validar cupom. Tente novamente.'
    }
  }
}

// Validate affiliate status
const validateAffiliate = async (
  affiliateId: string, 
  companyId: string
): Promise<{ valid: boolean; affiliate?: Affiliated; message?: string }> => {
  try {
    console.log('   🔍 Buscando afiliado na collection "affiliated"...')
    console.log('   📌 AffiliateId recebido:', affiliateId)
    console.log('   📌 CompanyId recebido:', companyId)
    
    const affiliateRef = doc(db, 'affiliated', affiliateId)
    const affiliateDoc = await getDoc(affiliateRef)
    
    console.log('   📊 Documento existe?', affiliateDoc.exists())
    
    if (!affiliateDoc.exists()) {
      console.log('   ❌ Afiliado não encontrado no banco de dados')
      return { 
        valid: false,
        message: 'Afiliado não encontrado.'
      }
    }
    
    const rawData = affiliateDoc.data()
    console.log('   📦 Dados brutos do Firestore:', JSON.stringify(rawData, null, 2))
    
    const affiliate = {
      id: affiliateDoc.id,
      ...rawData,
      createdAt: rawData.createdAt?.toDate(),
      updatedAt: rawData.updatedAt?.toDate()
    } as Affiliated
    
    console.log('   📦 Dados do afiliado parseados:', {
      id: affiliate.id,
      name: affiliate.name,
      active: affiliate.active,
      company: affiliate.company_relationed,
      walletId: affiliate.walletId,
      walletIdType: typeof affiliate.walletId,
      walletIdLength: affiliate.walletId?.length
    })
    
    // Check if affiliate is active
    console.log('   🔍 Verificando se afiliado está ativo...')
    if (affiliate.active !== 'SIM') {
      console.log('   ❌ Afiliado não está ativo (status:', affiliate.active, ')')
      return { 
        valid: false,
        message: 'Este afiliado não está mais ativo.'
      }
    }
    console.log('   ✅ Afiliado está ativo')
    
    // Check if affiliate belongs to the company
    console.log('   🔍 Verificando se afiliado pertence à empresa:')
    console.log('      Company do afiliado:', affiliate.company_relationed)
    console.log('      Company do carrinho:', companyId)
    
    if (affiliate.company_relationed !== companyId) {
      console.log('   ❌ Afiliado não pertence a esta empresa')
      return { 
        valid: false,
        message: 'Este cupom não é válido para os produtos em seu carrinho.'
      }
    }
    console.log('   ✅ Afiliado pertence à empresa')
    
    // Check if affiliate has walletId configured
    console.log('   🔍 Verificando se afiliado tem walletId configurado...')
    console.log('      walletId valor:', affiliate.walletId)
    console.log('      walletId tipo:', typeof affiliate.walletId)
    console.log('      walletId é null?', affiliate.walletId === null)
    console.log('      walletId é undefined?', affiliate.walletId === undefined)
    console.log('      walletId é string vazia?', affiliate.walletId === '')
    
    if (!affiliate.walletId || affiliate.walletId.trim() === '') {
      console.log('   ❌ Afiliado não possui walletId configurado')
      console.log('   ❌ Motivo: walletId =', affiliate.walletId)
      return { 
        valid: false,
        message: 'Este cupom não pode ser utilizado no momento.'
      }
    }
    console.log('   ✅ Afiliado tem walletId:', affiliate.walletId)
    
    console.log('   ✅ Afiliado válido e configurado corretamente')
    return { valid: true, affiliate }
  } catch (error) {
    console.error('   ❌ Erro ao validar afiliado:', error)
    return { 
      valid: false,
      message: 'Erro ao validar afiliado. Tente novamente.'
    }
  }
}

// Calculate discount amount
const calculateDiscount = (coupon: Coupon, cartTotal: number): number => {
  if (coupon.discountType === 'percentage' && coupon.discountValue) {
    // discountValue representa a porcentagem (ex: 10 = 10%)
    const discount = Math.round((cartTotal * coupon.discountValue / 100) * 100) / 100
    console.log(`   Cálculo: ${cartTotal} × ${coupon.discountValue}% = R$ ${discount.toFixed(2)}`)
    return discount
  } else if (coupon.discountType === 'fixed' && coupon.discountValue) {
    // discountValue representa o valor fixo em BRL
    const discount = Math.min(coupon.discountValue, cartTotal)
    console.log(`   Cálculo: min(${coupon.discountValue}, ${cartTotal}) = R$ ${discount.toFixed(2)}`)
    return discount
  }
  console.log('   ⚠️ Tipo de desconto não reconhecido ou valor inválido')
  return 0
}

// Apply coupon (increment usage count)
export const applyCoupon = async (couponId: string): Promise<void> => {
  try {
    console.log('📝 Incrementando contador de uso do cupom:', couponId)
    const couponRef = doc(db, 'coupons', couponId)
    await updateDoc(couponRef, {
      usedCount: increment(1),
      updatedAt: new Date()
    })
    console.log('✅ Contador de uso incrementado com sucesso')
  } catch (error) {
    console.error('❌ Erro ao aplicar cupom:', error)
    throw error
  }
}

// Format discount for cart
export const formatCartDiscount = (
  coupon: Coupon,
  affiliate: Affiliated | undefined,
  discountAmount: number,
  originalTotal: number
): CartDiscount => {
  return {
    coupon,
    affiliate,
    discountAmount,
    originalTotal,
    finalTotal: originalTotal - discountAmount
  }
}
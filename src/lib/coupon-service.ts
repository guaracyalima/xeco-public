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
    // 1. Find coupon by code
    const couponsRef = collection(db, 'coupons')
    const q = query(couponsRef, where('code', '==', couponCode.toUpperCase()))
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      return {
        valid: false,
        message: 'Cupom não encontrado. Verifique o código e tente novamente.'
      }
    }
    
    const couponDoc = querySnapshot.docs[0]
    const coupon = {
      id: couponDoc.id,
      ...couponDoc.data(),
      expiresAt: couponDoc.data().expiresAt?.toDate(),
      createdAt: couponDoc.data().createdAt?.toDate(),
      updatedAt: couponDoc.data().updatedAt?.toDate()
    } as Coupon
    
    // 2. Validate coupon status
    if (!coupon.active) {
      return {
        valid: false,
        message: 'Este cupom não está mais válido.'
      }
    }
    
    // 3. Check expiration
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return {
        valid: false,
        message: 'Este cupom expirou.'
      }
    }
    
    // 4. Check usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return {
        valid: false,
        message: 'Este cupom atingiu o limite de uso.'
      }
    }
    
    // 5. Check company match
    if (coupon.companyId !== companyId) {
      return {
        valid: false,
        message: 'Este cupom não é válido para os produtos em seu carrinho.'
      }
    }
    
    // 6. Check minimum amount
    if (coupon.minimumAmount && cartTotal < coupon.minimumAmount) {
      return {
        valid: false,
        message: `Valor mínimo de R$ ${coupon.minimumAmount.toFixed(2)} não atingido para usar este cupom.`
      }
    }
    
    // 7. If it's an affiliate coupon, validate affiliate
    let affiliate: Affiliated | undefined
    if (coupon.type === 'AFFILIATE' && coupon.affiliateId) {
      const affiliateResult = await validateAffiliate(coupon.affiliateId, companyId)
      if (!affiliateResult.valid) {
        return {
          valid: false,
          message: 'O afiliado associado a este cupom não está mais ativo.'
        }
      }
      affiliate = affiliateResult.affiliate
    }
    
    // 8. Calculate discount
    const discountAmount = calculateDiscount(coupon, cartTotal)
    
    return {
      valid: true,
      message: 'Cupom aplicado com sucesso!',
      coupon,
      affiliate,
      discountAmount
    }
    
  } catch (error) {
    console.error('Error validating coupon:', error)
    return {
      valid: false,
      message: 'Erro interno. Tente novamente.'
    }
  }
}

// Validate affiliate status
const validateAffiliate = async (
  affiliateId: string, 
  companyId: string
): Promise<{ valid: boolean; affiliate?: Affiliated }> => {
  try {
    const affiliateRef = doc(db, 'affiliated', affiliateId)
    const affiliateDoc = await getDoc(affiliateRef)
    
    if (!affiliateDoc.exists()) {
      return { valid: false }
    }
    
    const affiliate = {
      id: affiliateDoc.id,
      ...affiliateDoc.data(),
      createdAt: affiliateDoc.data().createdAt?.toDate(),
      updatedAt: affiliateDoc.data().updatedAt?.toDate()
    } as Affiliated
    
    // Check if affiliate is active
    if (affiliate.active !== 'SIM') {
      return { valid: false }
    }
    
    // Check if affiliate belongs to the company
    if (affiliate.company_relationed !== companyId) {
      return { valid: false }
    }
    
    return { valid: true, affiliate }
  } catch (error) {
    console.error('Error validating affiliate:', error)
    return { valid: false }
  }
}

// Calculate discount amount
const calculateDiscount = (coupon: Coupon, cartTotal: number): number => {
  if (coupon.discountType === 'PERCENTAGE' && coupon.discountPercentage) {
    return Math.round((cartTotal * coupon.discountPercentage / 100) * 100) / 100
  } else if (coupon.discountType === 'FIXED' && coupon.discountValue) {
    return Math.min(coupon.discountValue, cartTotal)
  }
  return 0
}

// Apply coupon (increment usage count)
export const applyCoupon = async (couponId: string): Promise<void> => {
  try {
    const couponRef = doc(db, 'coupons', couponId)
    await updateDoc(couponRef, {
      usedCount: increment(1),
      updatedAt: new Date()
    })
  } catch (error) {
    console.error('Error applying coupon:', error)
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
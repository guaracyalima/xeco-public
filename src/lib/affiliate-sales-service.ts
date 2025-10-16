import { 
  collection, 
  addDoc,
  Timestamp 
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { AffiliateSale, Affiliated, CartDiscount } from '@/types'

// Create affiliate sale record when purchase is made with affiliate coupon
export const createAffiliateSale = async (
  affiliate: Affiliated,
  orderId: string,
  customerEmail: string,
  orderValue: number,
  couponCode: string,
  clickId?: string
): Promise<{ success: boolean; saleId?: string; error?: string }> => {
  try {
    // Calculate commission value
    const commissionValue = Math.round((orderValue * affiliate.commissionRate / 100) * 100) / 100

    const affiliateSale: Omit<AffiliateSale, 'id'> = {
      affiliateId: affiliate.id,
      storeId: affiliate.company_relationed,
      orderId: orderId,
      customerEmail: customerEmail,
      orderValue: orderValue,
      commissionValue: commissionValue,
      commissionRate: affiliate.commissionRate,
      couponUsed: couponCode,
      clickId: clickId,
      saleDate: new Date(),
      status: 'PENDING', // Will be confirmed when payment is processed
      paymentStatus: 'PENDING',
      createdAt: new Date()
    }

    const salesRef = collection(db, 'affiliate_sales')
    const saleDoc = await addDoc(salesRef, {
      ...affiliateSale,
      saleDate: Timestamp.now(),
      createdAt: Timestamp.now()
    })

    console.log('✅ Affiliate sale created:', {
      saleId: saleDoc.id,
      affiliateId: affiliate.id,
      orderId: orderId,
      commissionValue: commissionValue
    })

    return {
      success: true,
      saleId: saleDoc.id
    }

  } catch (error) {
    console.error('❌ Error creating affiliate sale:', error)
    return {
      success: false,
      error: 'Erro ao registrar venda do afiliado'
    }
  }
}

// Update affiliate sale status (called when order status changes)
export const updateAffiliateSaleStatus = async (
  orderId: string,
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED',
  paymentStatus?: 'PENDING' | 'PAID' | 'FAILED'
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Implementation will depend on how you want to query sales by orderId
    // For now, this is a placeholder structure
    console.log('🔄 Updating affiliate sale status:', {
      orderId,
      status,
      paymentStatus
    })

    // TODO: Implement actual update logic when order management is integrated
    return { success: true }

  } catch (error) {
    console.error('❌ Error updating affiliate sale status:', error)
    return {
      success: false,
      error: 'Erro ao atualizar status da venda'
    }
  }
}

// Calculate commission for a given order value and commission rate
export const calculateCommission = (orderValue: number, commissionRate: number): number => {
  return Math.round((orderValue * commissionRate / 100) * 100) / 100
}

// Helper function to extract affiliate sale data from cart discount
export const getAffiliateSaleData = (
  discount: CartDiscount,
  orderId: string,
  customerEmail: string
): {
  affiliate: Affiliated
  orderValue: number
  commissionValue: number
  couponCode: string
} | null => {
  if (!discount.affiliate) {
    return null
  }

  return {
    affiliate: discount.affiliate,
    orderValue: discount.originalTotal,
    commissionValue: calculateCommission(discount.originalTotal, discount.affiliate.commissionRate),
    couponCode: discount.coupon.code
  }
}
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Script para criar cupons de teste
export async function createTestCoupons() {
  try {
    const testCoupons = [
      // Company Coupon - Percentage
      {
        code: "SAVE10",
        type: "COMPANY",
        companyId: "company-test-123", // Substitua pelo ID real da empresa
        discountType: "PERCENTAGE",
        discountPercentage: 10,
        active: true,
        usageLimit: 100,
        usedCount: 0,
        minimumAmount: 50,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      
      // Company Coupon - Fixed Value
      {
        code: "FIXED20",
        type: "COMPANY", 
        companyId: "company-test-123",
        discountType: "FIXED",
        discountValue: 20,
        active: true,
        usageLimit: 50,
        usedCount: 0,
        minimumAmount: 100,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      
      // Affiliate Coupon
      {
        code: "AFILIADO15",
        type: "AFFILIATE",
        companyId: "company-test-123",
        affiliateId: "affiliate-test-123", // Substitua pelo ID real do afiliado
        discountType: "PERCENTAGE", 
        discountPercentage: 15,
        active: true,
        usageLimit: 30,
        usedCount: 0,
        minimumAmount: 75,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      
      // Expired Coupon (for testing)
      {
        code: "EXPIRED",
        type: "COMPANY",
        companyId: "company-test-123",
        discountType: "PERCENTAGE",
        discountPercentage: 20,
        active: true,
        expiresAt: Timestamp.fromDate(new Date('2024-01-01')), // Expired
        usageLimit: 10,
        usedCount: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      
      // Inactive Coupon (for testing)
      {
        code: "INACTIVE",
        type: "COMPANY",
        companyId: "company-test-123", 
        discountType: "PERCENTAGE",
        discountPercentage: 25,
        active: false, // Inactive
        usageLimit: 20,
        usedCount: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }
    ]

    const results = []
    for (const coupon of testCoupons) {
      const docRef = await addDoc(collection(db, 'coupons'), coupon)
      results.push({
        id: docRef.id,
        code: coupon.code,
        type: coupon.type,
        active: coupon.active
      })
    }
    
    console.log('✅ Cupons de teste criados:', results)
    return { success: true, coupons: results }
  } catch (error) {
    console.error('❌ Erro ao criar cupons de teste:', error)
    return { success: false, error }
  }
}

// Create test affiliate for affiliate coupons
export async function createTestAffiliate() {
  try {
    const testAffiliate = {
      user: "test-user-123", // Firebase Auth UID
      walletId: "",
      invite_code: "TESTAFIL",
      active: "SIM",
      company_relationed: "company-test-123",
      email: "afiliado@teste.com",
      whatsapp: "11999999999",
      name: "Afiliado Teste",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }

    const docRef = await addDoc(collection(db, 'affiliated'), testAffiliate)
    console.log('✅ Afiliado de teste criado:', docRef.id)
    
    return { 
      success: true, 
      affiliateId: docRef.id,
      inviteCode: testAffiliate.invite_code
    }
  } catch (error) {
    console.error('❌ Erro ao criar afiliado de teste:', error)
    return { success: false, error }
  }
}
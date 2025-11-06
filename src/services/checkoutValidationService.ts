/**
 * Serviço de Validação para Checkout
 * Valida todos os dados antes de criar o checkout
 */

import { db } from '@/lib/firebase'
import { collection, doc, getDoc, query, where, getDocs } from 'firebase/firestore'

export interface ValidationResult {
  valid: boolean
  errors: Array<{ code: string; description: string }>
  data?: {
    company: any
    products: any[]
    coupon?: any
    affiliate?: any
    finalTotal?: number
    discountValue?: number
  }
}

/**
 * Valida a request de checkout
 */
export async function validateCheckoutRequest(payload: any): Promise<ValidationResult> {
  const errors: Array<{ code: string; description: string }> = []

  try {
    // Validação 1: Verifica campos obrigatórios
    console.log('✓ Validando estrutura da request...')
    
    if (!payload.companyId || typeof payload.companyId !== 'string') {
      errors.push({ code: 'INVALID_COMPANY', description: 'companyId é obrigatório' })
    }

    if (!payload.userId || typeof payload.userId !== 'string') {
      errors.push({ code: 'INVALID_USER', description: 'userId é obrigatório' })
    }

    if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) {
      errors.push({ code: 'EMPTY_CART', description: 'Carrinho vazio' })
    }

    console.log('🔍 Validando totalAmount:', {
      recebido: payload.totalAmount,
      tipo: typeof payload.totalAmount,
      valido: typeof payload.totalAmount === 'number' && payload.totalAmount > 0
    })

    if (typeof payload.totalAmount !== 'number' || payload.totalAmount <= 0) {
      errors.push({ code: 'INVALID_TOTAL', description: 'totalAmount deve ser um número maior que zero' })
    }

    // Se houver erros básicos, para aqui
    if (errors.length > 0) {
      console.error('❌ Erros de validação básica:', errors)
      return { valid: false, errors }
    }

    // Validação 2: Valida a empresa
    console.log('✓ Validando empresa...')
    const companyRef = doc(db, 'companies', payload.companyId)
    const companyDoc = await getDoc(companyRef)

    if (!companyDoc.exists()) {
      errors.push({ code: 'COMPANY_NOT_FOUND', description: 'Empresa não encontrada' })
      return { valid: false, errors }
    }

    const company = companyDoc.data()

    // Verifica se empresa está ativa
    if (!company.status) {
      errors.push({ code: 'COMPANY_INACTIVE', description: 'Empresa não está ativa' })
    }

    // Verifica se empresa tem walletId configurado
    if (!company.asaasWalletId && !company.walletId) {
      errors.push({ code: 'NO_WALLET', description: 'Empresa não está configurada para receber pagamentos' })
    }

    if (errors.length > 0) {
      return { valid: false, errors }
    }

    // Validação 3: Valida produtos e estoque
    console.log('✓ Validando produtos e estoque...')
    const products = []
    let calculatedTotal = 0

    for (const item of payload.items) {
      if (!item.productId || !item.quantity) {
        errors.push({
          code: 'INVALID_ITEM',
          description: `Item inválido: faltam dados`
        })
        continue
      }

      const productRef = doc(db, 'product', item.productId)
      const productDoc = await getDoc(productRef)

      if (!productDoc.exists()) {
        errors.push({
          code: 'PRODUCT_NOT_FOUND',
          description: `Produto ${item.productId} não encontrado`
        })
        continue
      }

      const product = productDoc.data()

      // Valida estoque
      if (!product.stockQuantity || product.stockQuantity < item.quantity) {
        errors.push({
          code: 'OUT_OF_STOCK',
          description: `Produto "${product.name}" não tem estoque suficiente`
        })
        continue
      }

      // Valida se produto pertence à empresa
      if (product.companyOwner !== payload.companyId) {
        errors.push({
          code: 'PRODUCT_NOT_FROM_COMPANY',
          description: `Produto "${product.name}" não pertence a esta empresa`
        })
        continue
      }

      // Calcula total do item usando SEMPRE o preço do banco
      const itemTotal = product.salePrice * item.quantity
      calculatedTotal += itemTotal

      products.push({
        id: item.productId, // ← CRÍTICO: adiciona o ID do documento
        ...product,
        requestedQuantity: item.quantity,
        unitPrice: product.salePrice,
        itemTotal
      })
    }

    if (errors.length > 0) {
      return { valid: false, errors }
    }

    // Validação 4: Valida cupom de afiliado (se fornecido)
    console.log('✓ Validando cupom...')
    let coupon = null
    let affiliate = null
    let finalTotal = calculatedTotal
    let discountValue = 0

    if (payload.couponCode) {
      // Busca o cupom
      const couponsRef = collection(db, 'coupons')
      const q = query(
        couponsRef,
        where('code', '==', payload.couponCode),
        where('companyId', '==', payload.companyId)
      )
      const couponDocs = await getDocs(q)

      if (couponDocs.empty) {
        errors.push({
          code: 'COUPON_NOT_FOUND',
          description: 'Cupom não encontrado para esta empresa'
        })
      } else {
        const couponId = couponDocs.docs[0].id // ← 🎯 PEGA O ID DO CUPOM!
        coupon = couponDocs.docs[0].data()
        coupon.id = couponId // ← Adiciona o ID no objeto
        
        console.log('🔍 [BACKEND] Dados BRUTOS do cupom:', coupon)
        console.log('🔍 [BACKEND] ID do cupom:', couponId)
        console.log('🔍 [BACKEND] Campos do cupom:', Object.keys(coupon))

        // Valida se cupom está ativo (aceita isActive=true, status='ACTIVE' OU active='SIM')
        const isActive = coupon.isActive === true || coupon.status === 'ACTIVE' || coupon.active === 'SIM'
        console.log('🔍 [BACKEND] Validando status do cupom:', {
          isActive: coupon.isActive,
          status: coupon.status,
          active: coupon.active,
          resultado: isActive
        })
        
        if (!isActive) {
          errors.push({
            code: 'COUPON_INACTIVE',
            description: 'Cupom expirado ou inativo'
          })
        }

        // Valida data de expiração
        if (coupon.expiryDate) {
          const expiryDate = new Date(coupon.expiryDate)
          if (expiryDate < new Date()) {
            errors.push({
              code: 'COUPON_EXPIRED',
              description: 'Cupom expirou'
            })
          }
        }

        if (errors.length > 0) {
          return { valid: false, errors }
        }

        // Se é cupom de afiliado
        if (coupon.type === 'AFFILIATE' || coupon.affiliateId) {
          // Busca dados do afiliado
          const affiliateRef = doc(db, 'affiliated', coupon.affiliateId)
          const affiliateDoc = await getDoc(affiliateRef)

          if (affiliateDoc.exists()) {
            const affiliateData = affiliateDoc.data()
            affiliate = {
              id: affiliateDoc.id,
              ...affiliateData,
              commissionRate: affiliateData.commissionRate || 5 // Taxa de comissão do afiliado
            }
            
            console.log('📊 Afiliado encontrado:', {
              id: affiliate.id,
              name: affiliate.name,
              commissionRate: affiliate.commissionRate,
              walletId: affiliate.walletId
            })
            
            // Calcula desconto baseado no tipo
            if (coupon.discountType === 'percentage') {
              discountValue = coupon.discountValue || 0
              finalTotal = calculatedTotal * (1 - discountValue / 100)
            } else {
              discountValue = coupon.discountValue || 0
              finalTotal = calculatedTotal - discountValue
            }
          }
        } else {
          // Cupom de desconto normal
          if (coupon.discountType === 'percentage') {
            discountValue = coupon.discountValue || 0
            finalTotal = calculatedTotal * (1 - discountValue / 100)
          } else {
            discountValue = coupon.discountValue || 0
            finalTotal = calculatedTotal - discountValue
          }
        }
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors }
    }

    // Validação 5: Valida total
    console.log('✓ Validando total...')
    console.log('💰 Total calculado vs. recebido:', {
      calculatedTotal,
      finalTotal,
      payloadTotalAmount: payload.totalAmount,
      diferenca: Math.abs(payload.totalAmount - finalTotal)
    })

    // Double-check: o total enviado deve bater com o calculado (com margem de erro de 0.01 para arredondamentos)
    if (Math.abs(payload.totalAmount - finalTotal) > 0.01) {
      console.error('❌ TOTAL_MISMATCH:', {
        esperado: finalTotal,
        recebido: payload.totalAmount,
        diferenca: Math.abs(payload.totalAmount - finalTotal)
      })
      errors.push({
        code: 'TOTAL_MISMATCH',
        description: `Total divergente. Esperado: ${finalTotal}, recebido: ${payload.totalAmount}`
      })
      return { valid: false, errors }
    }

    console.log('✓ Todas as validações passaram!')
    console.log('📊 Dados validados:', {
      companyId: company.id,
      productsCount: products.length,
      finalTotal,
      discountValue,
      couponId: coupon?.id || 'N/A',
      affiliateId: affiliate?.id || 'N/A'
    })

    return {
      valid: true,
      errors: [],
      data: {
        company,
        products,
        coupon,
        affiliate,
        finalTotal,
        discountValue
      }
    }
  } catch (error) {
    console.error('❌ Erro ao validar checkout:', error)
    return {
      valid: false,
      errors: [
        {
          code: 'VALIDATION_ERROR',
          description: error instanceof Error ? error.message : 'Erro ao validar dados'
        }
      ]
    }
  }
}

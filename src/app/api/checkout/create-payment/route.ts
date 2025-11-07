/**
 * API Route: Criar Checkout via n8n
 * 
 * Fluxo:
 * 1. Valida a request completa (empresa, produtos, estoque, cupom)
 * 2. Calcula os splits de pagamento
 * 3. Chama o n8n para criar o checkout no Asaas
 * 4. Salva os dados da order no Firebase com status PENDING
 * 5. Retorna a URL de checkout para o frontend
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateCheckoutRequest } from '@/services/checkoutValidationService'
import { validateCheckoutSignature } from '@/lib/checkout-signature'
import { calculateSplits } from '@/services/splitCalculationService'
import { db } from '@/lib/firebase'
import { collection, doc, setDoc, updateDoc, writeBatch } from 'firebase/firestore'
import { imageUrlToBase64 } from '@/lib/base64-converter'
import { env } from '@/lib/env'
import { debugLog } from '@/lib/feature-flags'
import { retryN8N } from '@/lib/retry'

const N8N_WEBHOOK_URL = env.NEXT_PUBLIC_N8N_WEBHOOK_URL

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 API Route: Recebendo requisição de checkout')
    
    // Pega o body da requisição
    const body = await request.json()
    
    console.log('\n' + '='.repeat(80))
    console.log('📋 RAW PAYLOAD RECEBIDO NO BACKEND:')
    console.log('='.repeat(80))
    console.log(JSON.stringify(body, null, 2))
    console.log('='.repeat(80) + '\n')
    
    console.log('\n' + '🚨'.repeat(40))
    console.log('🚨 [API ROUTE] COUPON CODE NO BODY:')
    console.log('🚨 body.couponCode:', body.couponCode)
    console.log('🚨 typeof:', typeof body.couponCode)
    console.log('🚨 body tem couponCode?', 'couponCode' in body)
    console.log('🚨'.repeat(40) + '\n')
    
    console.log('📋 Payload recebido na API route:', {
      companyId: body.companyId,
      userId: body.userId,
      itemsCount: body.items?.length,
      totalAmount: body.totalAmount,
      totalAmountType: typeof body.totalAmount,
      totalAmountExists: 'totalAmount' in body,
      couponCode: body.couponCode,
      customerData: {
        name: body.customerData?.name,
        email: body.customerData?.email,
        cpfCnpj: body.customerData?.cpfCnpj
      }
    })

    // Passo 1: Valida a request completa
    console.log('🔍 Iniciando validações...')
    
    // 1.1: Valida assinatura HMAC (fraud prevention)
    console.log('🔒 Validando assinatura HMAC...')
    if (body.signature) {
      try {
        // ⚠️ CRÍTICO: Estrutura DEVE ser IDÊNTICA ao N8N
        // N8N NÃO inclui productId na validação!
        const dataToValidate = {
          companyId: body.companyId,
          totalAmount: body.totalAmount,
          items: body.productList.map((item: any) => ({
            // ⚠️ NÃO incluir productId - N8N não valida isso!
            quantity: item.quantity,
            unitPrice: typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : item.unitPrice // ← Converte pra NUMBER
          }))
        }
        
        console.log('🔐 Backend - Dados usados para validar assinatura:', JSON.stringify(dataToValidate, null, 2))
        console.log('🔐 Backend - Assinatura recebida:', body.signature)
        
        const isSignatureValid = validateCheckoutSignature(dataToValidate, body.signature)

        if (!isSignatureValid) {
          console.error('❌ ASSINATURA INVÁLIDA - Possível fraude detectada!')
          console.error('📋 Dados recebidos para validação:', {
            companyId: body.companyId,
            totalAmount: body.totalAmount,
            productList: body.productList,
            signature: body.signature
          })
          return NextResponse.json(
            { 
              error: 'SIGNATURE_INVALID',
              description: 'Dados foram alterados após assinatura' 
            },
            { status: 403 }
          )
        }
        console.log('✅ Assinatura HMAC válida')
      } catch (err) {
        console.error('❌ Erro ao validar assinatura:', err)
        return NextResponse.json(
          { 
            error: 'SIGNATURE_VALIDATION_ERROR',
            description: 'Erro ao validar integridade dos dados' 
          },
          { status: 403 }
        )
      }
    } else {
      console.warn('⚠️ Nenhuma assinatura foi fornecida - considerando válido')
    }

    // 1.2: Validação completa de dados
    const validation = await validateCheckoutRequest(body)

    if (!validation.valid) {
      console.error('❌ Validação falhou:', validation.errors)
      return NextResponse.json(
        { errors: validation.errors },
        { status: 400 }
      )
    }

    const {
      company,
      products,
      coupon,
      affiliate,
      finalTotal = 0,
      discountValue = 0
    } = validation.data!

    console.log('✅ Validações OK!')
    console.log('💰 Total após validação:', {
      finalTotal,
      discountValue,
      productsCount: products.length
    })

    // Passo 2: Usa os splits que vieram do frontend (já calculados corretamente)
    console.log('💰 Usando splits do frontend...')
    console.log('💰 Splits recebidos:', body.splits)
    console.log('💰 Quantidade de splits:', body.splits?.length || 0)
    
    // Valida que os splits existem
    if (!body.splits || body.splits.length === 0) {
      console.error('❌ Nenhum split foi enviado pelo frontend!')
      return NextResponse.json(
        { error: 'SPLITS_MISSING', description: 'Splits de pagamento não foram enviados' },
        { status: 400 }
      )
    }
    
    // Usa os splits que vieram do frontend
    const splits = {
      splits: body.splits,
      platformFeePercentage: 8,
      platformFeeAmount: (finalTotal * 8) / 100,
      companyPercentage: body.splits[0].percentageValue,
      companyAmount: (finalTotal * body.splits[0].percentageValue) / 100,
      affiliatePercentage: body.splits.length > 1 ? body.splits[1].percentageValue : 0,
      affiliateAmount: body.splits.length > 1 ? (finalTotal * body.splits[1].percentageValue) / 100 : 0
    }
    
    console.log('✅ Splits validados:', {
      totalSplits: splits.splits.length,
      company: `${splits.companyPercentage}% = R$ ${splits.companyAmount.toFixed(2)}`,
      affiliate: splits.affiliatePercentage > 0 
        ? `${splits.affiliatePercentage}% = R$ ${splits.affiliateAmount.toFixed(2)}`
        : 'Sem afiliado'
    })

    // Passo 3: Busca imagens dos produtos usando ImageService (Strategy Pattern + Circuit Breaker)
    console.log('🖼️ Buscando imagens dos produtos com fallback em cascata...')
    
    const { getProductImageBase64 } = await import('@/lib/image-providers')
    
    const itemsWithBase64 = await Promise.all(
      products.map(async (product) => {
        // ImageService tenta: 1) Firebase Storage, 2) Public URL, 3) Embedded fallback
        const imageBase64 = await getProductImageBase64(product.image)
        
        return {
          externalReference: product.id,
          name: product.name.substring(0, 30), // ← LIMITADO A 30 CARACTERES
          description: (product.description || product.name).substring(0, 150), // ← LIMITADO A 150 CARACTERES
          quantity: product.requestedQuantity,
          value: Number(product.unitPrice),
          imageBase64 // ✅ SEMPRE tem valor (fallback garantido)
        }
      })
    )

    // Log para verificar TODOS os items
    console.log('🔍 TODOS OS ITEMS:', JSON.stringify(itemsWithBase64.map(item => ({
      externalReference: item.externalReference,
      name: item.name,
      nameLength: item.name.length
    })), null, 2))

    // Passo 3.5: 💾 SALVA A ORDER NO FIREBASE ANTES DE CHAMAR O N8N
    // Isso é CRÍTICO porque o N8N valida se a order existe!
    console.log('💾 Salvando ordem no Firebase ANTES de chamar N8N...')
    
    // ⚠️ VALIDAÇÃO CRÍTICA: userId deve existir
    if (!body.userId) {
      console.error('❌ ERRO CRÍTICO: userId não foi enviado no payload!')
      console.error('📋 Body recebido:', JSON.stringify(body, null, 2))
      return NextResponse.json(
        {
          errors: [
            {
              code: 'MISSING_USER_ID',
              description: 'ID do usuário é obrigatório'
            }
          ]
        },
        { status: 400 }
      )
    }
    
    console.log('✅ userId encontrado:', body.userId)
    
    const orderId = body.orderId || `order-${Date.now()}`
    const orderRef = doc(db, 'orders', orderId)
    
    const orderData = {
      id: orderId,
      userId: body.userId, // ← CRÍTICO: N8N valida isso
      companyId: body.companyId,
      products: products.map(p => ({
        productId: p.id,
        productName: p.name,
        quantity: p.requestedQuantity,
        unitPrice: p.unitPrice,
        itemTotal: p.itemTotal
      })),
      subtotal: products.reduce((sum, p) => sum + p.itemTotal, 0),
      discount: (discountValue || 0) > 0 ? (body.totalAmount * (discountValue || 0)) / 100 : 0,
      total: finalTotal,
      couponCode: body.couponCode || null,
      couponId: coupon?.id || null,
      affiliateId: affiliate?.id || null,
      status: 'PENDING_PAYMENT', // ← Status inicial: aguardando pagamento
      customerData: body.customerData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    // Remove campos undefined (Firebase não aceita)
    const cleanOrderData = JSON.parse(JSON.stringify(orderData))
    
    debugLog('firebase', 'Preparando transação atômica para salvar order + sale...')
    
    // � USA BATCH PARA GARANTIR ATOMICIDADE
    // Se falhar em qualquer ponto, NADA é salvo no Firestore
    const batch = writeBatch(db)
    
    // Adiciona order ao batch
    batch.set(orderRef, cleanOrderData, { merge: true })
    debugLog('firebase', 'Order adicionada ao batch', { orderId })

    // 🔥 CRIAR SALE SE TIVER AFILIADO (no mesmo batch)
    let saleId: string | null = null
    if (affiliate?.id && coupon?.id) {
      debugLog('affiliate', 'Criando sale para afiliado no batch...', {
        affiliateId: affiliate.id,
        couponCode: body.couponCode,
      })
      
      const commissionRate = affiliate.commissionRate || 5
      const platformFeeRate = 8 // Taxa da plataforma
      
      const affiliateCommission = finalTotal * (commissionRate / 100)
      const platformFee = finalTotal * (platformFeeRate / 100)
      const netValue = finalTotal - platformFee
      
      const saleData = {
        // Identificadores
        orderId,
        userId: body.userId,
        companyId: body.companyId,
        
        // Dados do afiliado
        affiliateId: affiliate.id,
        affiliateName: affiliate.name || 'N/A',
        hasAffiliate: true,
        couponId: coupon.id,
        couponCode: body.couponCode,
        
        // Valores financeiros
        grossValue: finalTotal,
        netValue,
        platformFee,
        affiliateCommission,
        
        // Produtos
        products: products.map(p => ({
          productId: p.id,
          productName: p.name,
          quantity: p.requestedQuantity,
          unitPrice: p.unitPrice
        })),
        itemsCount: products.length,
        
        // Status e datas
        paymentStatus: 'PENDING', // ← Aguardando pagamento
        paymentMethod: null, // ← Será preenchido no webhook
        saleDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        paidAt: null, // ← Será preenchido quando pago
        
        // Origem
        source: 'checkout_created'
      }
      
      // Adiciona sale ao batch
      const salesRef = collection(db, 'sales')
      const saleRef = doc(salesRef)
      saleId = saleRef.id
      batch.set(saleRef, saleData)
      
      debugLog('affiliate', 'Sale adicionada ao batch', {
        saleId,
        affiliateCommission,
        platformFee,
      })
    }

    // 💾 COMMIT ATÔMICO - Ou salva tudo, ou não salva nada
    try {
      debugLog('firebase', 'Executando batch.commit()...')
      await batch.commit()
      
      console.log('✅ Order e Sale salvas atomicamente no Firebase')
      console.log('  📦 Order ID:', orderId)
      if (saleId) {
        console.log('  💰 Sale ID:', saleId)
        console.log('  🤝 Afiliado:', affiliate?.id)
      }
      
    } catch (error: any) {
      console.error('❌ Erro ao salvar order+sale no Firebase:', error.message)
      console.error('❌ Stack trace:', error.stack)
      return NextResponse.json(
        {
          errors: [
            {
              code: 'FIREBASE_ERROR',
              description: 'Erro ao salvar pedido no banco de dados (transação falhou)'
            }
          ]
        },
        { status: 500 }
      )
    }

    // Passo 4: Monta a requisição para o n8n
    console.log('📤 Montando payload para n8n...')
    
    // Monta externalReference com dados do afiliado se houver
    let externalReference = body.orderId || `order-${Date.now()}`
    if (affiliate && coupon) {
      const affiliateMetadata = {
        type: 'AFFILIATE_COMMISSION',
        affiliateId: affiliate.id,
        companyId: body.companyId,
        couponCode: coupon.code,
        orderId: body.orderId,
        commissionRate: affiliate.commissionRate,
        commissionValue: splits.affiliateAmount || 0
      }
      externalReference = JSON.stringify(affiliateMetadata)
      console.log('🏷️ ExternalReference com dados de afiliado:', externalReference)
    }
    
    const n8nPayload = {
      billingTypes: ['CREDIT_CARD'],
      chargeTypes: ['DETACHED', 'INSTALLMENT'],
      minutesToExpire: 15,
      externalReference,
      totalAmount: finalTotal,
      callback: {
        successUrl: 'https://xeco.com.br/checkout/success',
        cancelUrl: 'https://xeco.com.br/checkout/cancel',
        expiredUrl: 'https://xeco.com.br/checkout/expired'
      },
      items: itemsWithBase64,
      customerData: body.customerData,
      installment: {
        maxInstallmentCount: 1
      },
      splits: splits.splits,
      companyId: body.companyId,
      companyOrder: company.name,
      userId: body.userId,
      orderId: body.orderId || `order-${Date.now()}`, // ← ADICIONADO: orderId para validação n8n
      signature: body.signature, // ← ADICIONADO: signature HMAC para fraud prevention
      // ⚠️ CRÍTICO: Reconstrói productList com os MESMOS dados usados na assinatura
      productList: products.map(p => ({
        productId: p.id,
        productName: p.name,
        quantity: p.requestedQuantity,
        unitPrice: Number(p.unitPrice), // ← Garante que é NUMBER (mesma conversão do frontend)
        totalPrice: p.itemTotal
      }))
    }

    // ⚠️ DEBUG: Log do productList sendo enviado
    console.log('🔍 ProductList sendo enviado ao N8N:', JSON.stringify(n8nPayload.productList, null, 2))
    
    // ⚠️ DEBUG: Log dos items com imageBase64 sendo enviados
    console.log('🔍 Items com imageBase64 sendo enviados ao N8N:')
    n8nPayload.items.forEach((item, index) => {
      console.log(`  [${index + 1}] ${item.name}:`, {
        hasImageBase64: !!item.imageBase64,
        imageLength: item.imageBase64?.length || 0,
        firstChars: item.imageBase64?.substring(0, 30) + '...'
      })
    })

    // Passo 5: Chama o n8n
    console.log('📞 Chamando n8n...')
    console.log('📤 Payload n8n sendo enviado:', {
      totalAmount: n8nPayload.totalAmount,
      totalAmountType: typeof n8nPayload.totalAmount,
      itemsCount: n8nPayload.items?.length,
      splitsCount: n8nPayload.splits?.length,
      externalReference: n8nPayload.externalReference
    })
    
    // 🔐 DEBUG: Log dos dados usados para validação no N8N
    console.log('🔐 Dados que o N8N vai usar para validar assinatura:', {
      companyId: n8nPayload.companyId,
      totalAmount: n8nPayload.totalAmount,
      items: n8nPayload.productList?.map(p => ({
        productId: p.productId,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
        unitPriceType: typeof p.unitPrice
      }))
    })
    
    // ⚠️ DEBUG: Log COMPLETO do payload N8N (truncando base64)
    console.log('🔍 PAYLOAD COMPLETO N8N:', JSON.stringify({
      ...n8nPayload,
      items: n8nPayload.items?.map(item => ({
        ...item,
        imageBase64: item.imageBase64 
          ? `[JPEG base64: ${item.imageBase64.length} chars]`
          : 'MISSING'
      }))
    }, null, 2))

    // 🔄 Chama N8N com retry automático (3 tentativas, exponential backoff)
    debugLog('webhook', 'Iniciando chamada N8N com retry...', {
      orderId,
      companyId: body.companyId,
      totalAmount: finalTotal,
    })

    const n8nResult = await retryN8N(N8N_WEBHOOK_URL, n8nPayload, {
      context: 'checkout-payment',
      orderId,
      companyId: body.companyId,
      totalAmount: finalTotal,
    })

    // Valida se teve sucesso após retries
    if (!n8nResult.success) {
      console.error('❌ N8N falhou após todas as tentativas de retry:', {
        attempts: n8nResult.attempts,
        duration: n8nResult.totalDuration,
        error: n8nResult.error?.message,
      })
      
      return NextResponse.json(
        {
          errors: [
            {
              code: 'N8N_ERROR',
              description: `Erro ao processar pagamento após ${n8nResult.attempts} tentativa(s): ${n8nResult.error?.message || 'Erro desconhecido'}`
            }
          ]
        },
        { status: 503 } // Service Unavailable
      )
    }

    console.log('✅ N8N respondeu com sucesso após', n8nResult.attempts, 'tentativa(s), em', n8nResult.totalDuration, 'ms')

    let n8nData = n8nResult.data
    
    // Se retornar array, pega o primeiro item
    if (Array.isArray(n8nData)) {
      console.log('📦 N8N retornou array, pegando primeiro item...')
      n8nData = n8nData[0]
    }

    console.log('📥 Dados processados do N8N:', {
      hasCheckoutUrl: !!n8nData.checkoutUrl,
      hasAsaasPaymentId: !!n8nData.asaasPaymentId,
      status: n8nData.status
    })

    // Valida se tem link de pagamento
    if (!n8nData.checkoutUrl || !n8nData.asaasPaymentId) {
      console.error('❌ Resposta do n8n incompleta:', n8nData)
      return NextResponse.json(
        {
          errors: [
            {
              code: 'INVALID_RESPONSE',
              description: 'Servidor retornou dados incompletos'
            }
          ]
        },
        { status: 400 }
      )
    }

    // Passo 6: ✏️ ATUALIZA a order no Firebase com os dados do Asaas
    console.log('✏️ Atualizando ordem no Firebase com dados do Asaas...')
    
    try {
      await updateDoc(orderRef, {
        status: 'PENDING_PAYMENT', // Aguardando pagamento
        asaasPaymentId: n8nData.asaasPaymentId,
        checkoutUrl: n8nData.checkoutUrl,
        splits: {
          platformFeePercentage: splits.platformFeePercentage,
          platformFeeAmount: splits.platformFeeAmount,
          companyPercentage: splits.companyPercentage,
          companyAmount: splits.companyAmount,
          affiliatePercentage: splits.affiliatePercentage,
          affiliateAmount: splits.affiliateAmount
        },
        updatedAt: new Date().toISOString()
      })
      console.log('✅ Order atualizada com dados do Asaas!')
    } catch (error: any) {
      console.error('⚠️ Erro ao atualizar order (não crítico):', error.message)
      // Não retorna erro, pois a order já foi criada e o checkout também
    }

    // Passo 7: Retorna o link de checkout
    console.log('🎉 Checkout criado com sucesso!')
    return NextResponse.json({
      success: true,
      asaasPaymentId: n8nData.asaasPaymentId,
      checkoutUrl: n8nData.checkoutUrl,
      orderId,
      message: 'Checkout criado com sucesso'
    })

  } catch (error) {
    console.error('❌ Erro na API Route:', error)
    
    return NextResponse.json(
      { 
        errors: [
          {
            code: 'SERVER_ERROR',
            description: error instanceof Error ? error.message : 'Erro interno do servidor'
          }
        ]
      },
      { status: 500 }
    )
  }
}


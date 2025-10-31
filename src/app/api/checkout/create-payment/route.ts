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
import { collection, doc, setDoc, updateDoc } from 'firebase/firestore'
import { imageUrlToBase64 } from '@/lib/base64-converter'

const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 
                        'https://primary-production-9acc.up.railway.app/webhook/xeco-create-checkout'

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

    // Passo 3: Usa imagem default local (WORKAROUND Asaas)
    console.log('Usando imagem default local para todos os produtos...')
    
    const fs = require('fs')
    const path = require('path')
    const sharp = require('sharp')
    
    const defaultImagePath = path.join(process.cwd(), 'public', 'default-product-image.png')
    console.log('Lendo:', defaultImagePath)
    
    let defaultImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    
    try {
      const imageBuffer = fs.readFileSync(defaultImagePath)
      const jpegBuffer = await sharp(imageBuffer)
        .jpeg({ quality: 85, progressive: true, mozjpeg: true })
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .toBuffer()
      
      const base64Pure = jpegBuffer.toString('base64')
      defaultImageBase64 = `data:image/jpeg;base64,${base64Pure}` // <- COM PREFIXO!
      
      console.log('Base64 gerado:', defaultImageBase64.length, 'chars, KB:', (jpegBuffer.length / 1024).toFixed(2))
      console.log('Formato:', defaultImageBase64.substring(0, 50) + '...')
    } catch (error: any) {
      console.error('Erro imagem default:', error.message)
    }
    
    const itemsWithBase64 = products.map((product) => ({
      externalReference: product.id,
      name: product.name.substring(0, 30), // ← LIMITADO A 30 CARACTERES
      description: (product.description || product.name).substring(0, 150), // ← LIMITADO A 150 CARACTERES
      quantity: product.requestedQuantity,
      value: Number(product.unitPrice)
      // imageBase64 removido para testar
    }))

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
    
    console.log('🔍 Tentando salvar order no Firebase...')
    console.log('🔍 Order ID:', orderId)
    console.log('🔍 Order Data keys:', Object.keys(cleanOrderData))
    console.log('🔍 Order Data:', JSON.stringify(cleanOrderData, null, 2))
    console.log('🔍 Firebase db instance:', db ? 'EXISTS' : 'NULL')
    console.log('🔍 Order ref:', orderRef ? 'EXISTS' : 'NULL')
    
    try {
      console.log('🔄 Chamando setDoc...')
      // Usa merge: true para não sobrescrever campos existentes (como 'items')
      await setDoc(orderRef, cleanOrderData, { merge: true })
      console.log('✅ Order salva no Firebase:', orderId)
    } catch (error: any) {
      console.error('❌ Erro ao salvar order no Firebase:', error.message)
      console.error('❌ Stack trace:', error.stack)
      return NextResponse.json(
        {
          errors: [
            {
              code: 'FIREBASE_ERROR',
              description: 'Erro ao salvar pedido no banco de dados'
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

    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(n8nPayload)
    })

    console.log('📥 Resposta do n8n:', n8nResponse.status)

    // Valida resposta
    if (!n8nResponse.ok) {
      const errorData = await n8nResponse.json()
      console.error('❌ Erro na resposta do n8n:', errorData)
      return NextResponse.json(
        {
          errors: [
            {
              code: 'N8N_ERROR',
              description: errorData.error || 'Erro ao processar pagamento'
            }
          ]
        },
        { status: 400 }
      )
    }

    let n8nData = await n8nResponse.json()
    
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


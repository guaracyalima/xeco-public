/**
 * API Route para gerar assinatura HMAC de checkout
 * 
 * ⚠️ IMPORTANTE: Esta rota roda no servidor, onde:
 * - crypto está disponível (Node.js)
 * - CHECKOUT_SIGNATURE_SECRET está disponível (variável server-only)
 * - Não expõe o secret ao browser
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateCheckoutSignature } from '@/lib/checkout-signature'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('🔐 [API] Gerando assinatura para checkout...')
    console.log('📋 [API] Dados recebidos:', {
      companyId: body.companyId,
      totalAmount: body.totalAmount,
      itemsCount: body.items?.length
    })
    
    // Valida dados obrigatórios
    if (!body.companyId || !body.totalAmount || !body.items) {
      return NextResponse.json(
        { error: 'Dados incompletos para gerar assinatura' },
        { status: 400 }
      )
    }
    
    // Gera assinatura (agora no servidor, onde crypto está disponível)
    const signature = generateCheckoutSignature({
      companyId: body.companyId,
      totalAmount: body.totalAmount,
      items: body.items,
      couponCode: body.couponCode
    })
    
    console.log('✅ [API] Assinatura gerada com sucesso')
    
    return NextResponse.json({ signature })
    
  } catch (error) {
    console.error('❌ [API] Erro ao gerar assinatura:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar assinatura' },
      { status: 500 }
    )
  }
}

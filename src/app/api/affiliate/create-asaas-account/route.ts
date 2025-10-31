import { NextRequest, NextResponse } from 'next/server'
import type { N8NAsaasAccountRequest, N8NAsaasAccountResponse } from '@/lib/n8n-config'

/**
 * API Route: /api/affiliate/create-asaas-account
 * 
 * Chama o workflow n8n para criar uma conta Asaas
 * O n8n faz a integração com a API do Asaas e retorna o walletId
 */
export async function POST(request: NextRequest) {
  try {
    const body: N8NAsaasAccountRequest = await request.json()
    
    console.log('📤 [API] Enviando requisição para n8n criar conta Asaas:', body.email)
    
    // URL do webhook n8n (deve estar no .env)
    const N8N_WEBHOOK_URL = process.env.N8N_ASAAS_ACCOUNT_WEBHOOK_URL
    
    if (!N8N_WEBHOOK_URL) {
      console.error('❌ [API] N8N_ASAAS_ACCOUNT_WEBHOOK_URL não configurada')
      return NextResponse.json(
        { 
          success: false, 
          error: 'Webhook n8n não configurado' 
        } as N8NAsaasAccountResponse,
        { status: 500 }
      )
    }
    
    // Chama o n8n
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    
    const data: N8NAsaasAccountResponse = await response.json()
    
    if (!response.ok || !data.success) {
      console.error('❌ [API] Erro do n8n ao criar conta:', data)
      return NextResponse.json(data, { status: response.status })
    }
    
    console.log('✅ [API] Conta Asaas criada com sucesso:', data.walletId)
    return NextResponse.json(data)
    
  } catch (error: any) {
    console.error('❌ [API] Erro ao criar conta Asaas:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Erro desconhecido' 
      } as N8NAsaasAccountResponse,
      { status: 500 }
    )
  }
}

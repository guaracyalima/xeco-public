import { NextRequest, NextResponse } from 'next/server'
import type { N8NAsaasAccountRequest, N8NAsaasAccountResponse } from '@/lib/n8n-config'
import { env } from '@/lib/env'
import { retryN8N } from '@/lib/retry'
import { debugLog } from '@/lib/feature-flags'

/**
 * API Route: /api/affiliate/create-asaas-account
 * 
 * Chama o workflow n8n para criar uma conta Asaas
 * O n8n faz a integração com a API do Asaas e retorna o walletId
 */
export async function POST(request: NextRequest) {
  try {
    const body: N8NAsaasAccountRequest = await request.json()
    
    debugLog('webhook', 'Criando conta Asaas via N8N', { email: body.email })
    
    // URL do webhook n8n (validado pelo env.ts)
    const N8N_WEBHOOK_URL = env.N8N_ASAAS_ACCOUNT_WEBHOOK_URL
    
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
    
    // 🔄 Chama o n8n com retry
    const result = await retryN8N<N8NAsaasAccountResponse>(
      N8N_WEBHOOK_URL,
      body,
      {
        context: 'create-asaas-account',
        email: body.email,
        affiliateId: body.affiliateId,
      }
    )
    
    if (!result.success || !result.data?.success) {
      console.error('❌ [API] N8N falhou ao criar conta Asaas:', {
        attempts: result.attempts,
        error: result.error?.message,
      })
      
      return NextResponse.json(
        {
          success: false,
          error: (result.data as any)?.error || result.error?.message || 'Erro ao criar conta'
        } as N8NAsaasAccountResponse,
        { status: 503 }
      )
    }
    
    console.log('✅ [API] Conta Asaas criada com sucesso após', result.attempts, 'tentativa(s):', result.data.walletId)
    return NextResponse.json(result.data)
    
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

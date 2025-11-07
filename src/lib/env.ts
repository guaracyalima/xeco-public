/**
 * 🔒 Validação de Variáveis de Ambiente
 * 
 * Este arquivo valida todas as variáveis de ambiente necessárias
 * no startup da aplicação, evitando erros em runtime.
 * 
 * Se alguma variável obrigatória estiver faltando, a aplicação
 * não inicia e mostra erro claro indicando qual env está faltando.
 */

import { z } from 'zod'

/**
 * Schema de validação para variáveis de ambiente
 * 
 * - .url() = deve ser URL válida
 * - .min(32) = mínimo 32 caracteres (para secrets)
 * - .optional() = variável opcional
 */
const envSchema = z.object({
  // NODE_ENV
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // 🔥 N8N Webhooks (CRÍTICO)
  NEXT_PUBLIC_N8N_WEBHOOK_URL: z.string().url({
    message: '❌ NEXT_PUBLIC_N8N_WEBHOOK_URL deve ser uma URL válida (ex: https://n8n.xeco.com.br/webhook/...)'
  }),
  
  N8N_ASAAS_ACCOUNT_WEBHOOK_URL: z.string().url({
    message: '❌ N8N_ASAAS_ACCOUNT_WEBHOOK_URL deve ser uma URL válida'
  }).optional(),

  // 🔐 Secrets (CRÍTICO)
  CHECKOUT_SIGNATURE_SECRET: z.string().min(32, {
    message: '❌ CHECKOUT_SIGNATURE_SECRET deve ter no mínimo 32 caracteres para ser seguro'
  }),

  // 🔥 Firebase Config (CRÍTICO)
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1, {
    message: '❌ NEXT_PUBLIC_FIREBASE_API_KEY não pode estar vazio'
  }),
  
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1, {
    message: '❌ NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN não pode estar vazio'
  }),
  
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1, {
    message: '❌ NEXT_PUBLIC_FIREBASE_PROJECT_ID não pode estar vazio'
  }),
  
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1, {
    message: '❌ NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET não pode estar vazio'
  }),
  
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1, {
    message: '❌ NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID não pode estar vazio'
  }),
  
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1, {
    message: '❌ NEXT_PUBLIC_FIREBASE_APP_ID não pode estar vazio'
  }),

  // 💳 Asaas (Pagamentos)
  NEXT_PUBLIC_ASAAS_API_KEY: z.string().optional(),
  NEXT_PUBLIC_ASAAS_API_URL: z.string().url().optional(),

  // 🌐 URLs públicas
  NEXT_PUBLIC_BASE_URL: z.string().default('xeco.com.br'),
  
  // 🔍 Algolia (Busca) - Opcional
  NEXT_PUBLIC_ALGOLIA_APP_ID: z.string().optional(),
  NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY: z.string().optional(),
  NEXT_PUBLIC_ALGOLIA_INDEX_NAME: z.string().optional(),

  // 📊 Sentry (Error Tracking) - Opcional
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
})

/**
 * Tipo TypeScript inferido do schema
 */
export type Env = z.infer<typeof envSchema>

/**
 * Função para validar e parsear as variáveis de ambiente
 */
function validateEnv(): Env {
  try {
    // Parse e valida todas as variáveis
    const parsed = envSchema.parse(process.env)
    
    // Log de sucesso (apenas em development)
    if (parsed.NODE_ENV === 'development') {
      console.log('✅ Variáveis de ambiente validadas com sucesso')
    }
    
    return parsed
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('\n❌ ERRO: Variáveis de ambiente inválidas ou faltando:\n')
      
      error.issues.forEach((err) => {
        console.error(`   🔴 ${err.path.join('.')}: ${err.message}`)
      })
      
      console.error('\n💡 Verifique seu arquivo .env.local e adicione as variáveis faltando\n')
      
      // Em produção, não pode continuar com envs inválidas
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Variáveis de ambiente inválidas em produção')
      }
    }
    
    // Em development, continua mas mostra warning
    console.warn('\n⚠️  Continuando em modo development, mas corrija os erros acima!\n')
    return process.env as unknown as Env
  }
}

/**
 * Variáveis de ambiente validadas e tipadas
 * 
 * USO:
 * ```typescript
 * import { env } from '@/lib/env'
 * 
 * const webhookUrl = env.NEXT_PUBLIC_N8N_WEBHOOK_URL
 * const secret = env.CHECKOUT_SIGNATURE_SECRET
 * ```
 */
export const env = validateEnv()

/**
 * Helper: Verifica se estamos em produção
 */
export const isProduction = env.NODE_ENV === 'production'

/**
 * Helper: Verifica se estamos em desenvolvimento
 */
export const isDevelopment = env.NODE_ENV === 'development'

/**
 * Helper: Verifica se estamos em testes
 */
export const isTest = env.NODE_ENV === 'test'

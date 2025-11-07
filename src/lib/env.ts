import { z } from 'zod'

const clientEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_N8N_WEBHOOK_URL: z.string().url(),
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_BASE_URL: z.string().optional(),
  NEXT_PUBLIC_DEFAULT_PRODUCT_IMAGE_URL: z.string().url().optional(),
})

const serverEnvSchema = clientEnvSchema.extend({
  CHECKOUT_SIGNATURE_SECRET: z.string().min(32),
  N8N_ASAAS_ACCOUNT_WEBHOOK_URL: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
})

type ClientEnv = z.infer<typeof clientEnvSchema>
type ServerEnv = z.infer<typeof serverEnvSchema>
export type Env = ServerEnv

const isBrowser = typeof window !== 'undefined'

function validateEnv(): ClientEnv | ServerEnv {
  // ✅ NO BROWSER: Usa direto do process.env (já injetado pelo Next.js em build time)
  if (isBrowser) {
    return {
      NODE_ENV: (process.env.NEXT_PUBLIC_NODE_ENV || process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
      NEXT_PUBLIC_N8N_WEBHOOK_URL: process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL!,
      NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
      NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
      NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
      NEXT_PUBLIC_DEFAULT_PRODUCT_IMAGE_URL: process.env.NEXT_PUBLIC_DEFAULT_PRODUCT_IMAGE_URL,
    } as ClientEnv
  }

  // ✅ NO SERVER: Valida com Zod
  try {
    const parsed = serverEnvSchema.parse(process.env)
    console.log('✅ Variáveis SERVER validadas')
    return parsed
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Variáveis SERVER inválidas:')
      error.issues.forEach((err) => console.error('🔴', err.path.join('.') + ':', err.message))
      
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Variáveis de ambiente inválidas em produção')
      }
    }
    
    console.warn('⚠️ Usando process.env diretamente (validação falhou)')
    return process.env as unknown as ServerEnv
  }
}

export const env = validateEnv()
export const isProduction = env.NODE_ENV === 'production'
export const isDevelopment = env.NODE_ENV === 'development'
export const isTest = env.NODE_ENV === 'test'

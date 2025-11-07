/**
 * 🚩 Sistema de Feature Flags
 * 
 * Permite ligar/desligar features e logs em produção sem redeploy.
 * 
 * USO:
 * ```typescript
 * import { flags } from '@/lib/feature-flags'
 * 
 * if (flags.DEBUG_CHECKOUT) {
 *   console.log('Debug do checkout')
 * }
 * ```
 * 
 * Para mudar em produção:
 * 1. Adicione env var: NEXT_PUBLIC_DEBUG_CHECKOUT=true
 * 2. Ou use query param: ?debug=checkout
 */

import { env, isDevelopment } from './env'

/**
 * Feature flags disponíveis
 */
export interface FeatureFlags {
  // 🐛 Debug Logs
  DEBUG_CHECKOUT: boolean           // Logs do fluxo de checkout
  DEBUG_AFFILIATE: boolean          // Logs do sistema de afiliados
  DEBUG_WEBHOOK: boolean            // Logs de chamadas N8N
  DEBUG_FIREBASE: boolean           // Logs de operações Firestore
  DEBUG_AUTH: boolean               // Logs de autenticação
  DEBUG_PAYMENT: boolean            // Logs de processamento de pagamento
  
  // 🔍 Features Experimentais
  ENABLE_ALGOLIA_SEARCH: boolean    // Busca com Algolia
  ENABLE_PERFORMANCE_MONITORING: boolean  // Tracking de performance
  ENABLE_ERROR_DETAILS: boolean     // Mostra detalhes de erro pro usuário
  
  // 🎨 UI Features
  SHOW_DEV_TOOLS: boolean           // Mostra ferramentas de dev na UI
}

/**
 * Valores padrão das flags
 */
const defaultFlags: FeatureFlags = {
  // Em development, todos os debugs estão LIGADOS
  // Em production, todos estão DESLIGADOS (a menos que ativado por env var)
  DEBUG_CHECKOUT: isDevelopment,
  DEBUG_AFFILIATE: isDevelopment,
  DEBUG_WEBHOOK: isDevelopment,
  DEBUG_FIREBASE: isDevelopment,
  DEBUG_AUTH: isDevelopment,
  DEBUG_PAYMENT: isDevelopment,
  
  // Features experimentais desligadas por padrão
  ENABLE_ALGOLIA_SEARCH: false,
  ENABLE_PERFORMANCE_MONITORING: false,
  ENABLE_ERROR_DETAILS: isDevelopment,
  
  // Dev tools só em development
  SHOW_DEV_TOOLS: isDevelopment,
}

/**
 * Le flags de variáveis de ambiente
 */
function getEnvFlags(): Partial<FeatureFlags> {
  const envFlags: Partial<FeatureFlags> = {}
  
  // Verifica cada flag no process.env
  Object.keys(defaultFlags).forEach((key) => {
    const envKey = `NEXT_PUBLIC_${key}`
    const envValue = process.env[envKey]
    
    if (envValue !== undefined) {
      envFlags[key as keyof FeatureFlags] = envValue === 'true' || envValue === '1'
    }
  })
  
  return envFlags
}

/**
 * Le flags de query params (client-side only)
 */
function getQueryFlags(): Partial<FeatureFlags> {
  // Só funciona no browser
  if (typeof window === 'undefined') {
    return {}
  }
  
  const params = new URLSearchParams(window.location.search)
  const debugParam = params.get('debug')
  
  if (!debugParam) {
    return {}
  }
  
  const queryFlags: Partial<FeatureFlags> = {}
  
  // ?debug=all - Liga todos os debugs
  if (debugParam === 'all') {
    queryFlags.DEBUG_CHECKOUT = true
    queryFlags.DEBUG_AFFILIATE = true
    queryFlags.DEBUG_WEBHOOK = true
    queryFlags.DEBUG_FIREBASE = true
    queryFlags.DEBUG_AUTH = true
    queryFlags.DEBUG_PAYMENT = true
    return queryFlags
  }
  
  // ?debug=checkout - Liga só debug de checkout
  if (debugParam === 'checkout') {
    queryFlags.DEBUG_CHECKOUT = true
    queryFlags.DEBUG_PAYMENT = true
    queryFlags.DEBUG_WEBHOOK = true
  }
  
  // ?debug=affiliate - Liga só debug de afiliados
  if (debugParam === 'affiliate') {
    queryFlags.DEBUG_AFFILIATE = true
  }
  
  return queryFlags
}

/**
 * Monta as flags finais
 * 
 * Ordem de precedência:
 * 1. Query params (maior prioridade)
 * 2. Env vars
 * 3. Defaults
 */
function buildFlags(): FeatureFlags {
  return {
    ...defaultFlags,
    ...getEnvFlags(),
    ...getQueryFlags(),
  }
}

/**
 * Feature flags globais
 * 
 * USO:
 * ```typescript
 * import { flags } from '@/lib/feature-flags'
 * 
 * if (flags.DEBUG_CHECKOUT) {
 *   console.log('🛒 Checkout data:', data)
 * }
 * ```
 */
export const flags = buildFlags()

/**
 * Hook para usar flags em React components
 * 
 * USO:
 * ```typescript
 * const flags = useFlags()
 * 
 * {flags.SHOW_DEV_TOOLS && <DevPanel />}
 * ```
 */
export function useFlags(): FeatureFlags {
  // Re-build flags no client-side para pegar query params
  if (typeof window !== 'undefined') {
    return buildFlags()
  }
  return flags
}

/**
 * Helper: Log condicional baseado em flag
 * 
 * USO:
 * ```typescript
 * import { debugLog } from '@/lib/feature-flags'
 * 
 * debugLog('checkout', 'Processando pagamento', { orderId: '123' })
 * // Só loga se DEBUG_CHECKOUT estiver true
 * ```
 */
export function debugLog(
  module: 'checkout' | 'affiliate' | 'webhook' | 'firebase' | 'auth' | 'payment',
  message: string,
  data?: any
) {
  const flagKey = `DEBUG_${module.toUpperCase()}` as keyof FeatureFlags
  
  if (flags[flagKey]) {
    const emoji = {
      checkout: '🛒',
      affiliate: '🤝',
      webhook: '🔗',
      firebase: '🔥',
      auth: '🔐',
      payment: '💳',
    }[module]
    
    console.log(`${emoji} [${module.toUpperCase()}]`, message, data || '')
  }
}

/**
 * Helper: Mostra painel de controle das flags (só em dev)
 */
export function showFlagsPanel() {
  if (!isDevelopment) return
  
  console.group('🚩 Feature Flags Status')
  Object.entries(flags).forEach(([key, value]) => {
    const emoji = value ? '✅' : '❌'
    console.log(`${emoji} ${key}: ${value}`)
  })
  console.groupEnd()
  
  console.info(`
💡 Para ativar flags em produção:
  
  Via ENV:
    NEXT_PUBLIC_DEBUG_CHECKOUT=true
  
  Via URL:
    ?debug=all
    ?debug=checkout
    ?debug=affiliate
  `)
}

// Mostra painel automaticamente em development
if (isDevelopment && typeof window !== 'undefined') {
  showFlagsPanel()
}

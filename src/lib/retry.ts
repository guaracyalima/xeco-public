/**
 * 🔄 Sistema de Retry com Exponential Backoff
 * 
 * Útil para chamadas HTTP que podem falhar temporariamente.
 * Especialmente importante para webhooks N8N que processam pagamentos.
 * 
 * Estratégia:
 * - Tentativa 1: Imediato
 * - Tentativa 2: Aguarda 1s
 * - Tentativa 3: Aguarda 2s
 * - Tentativa 4: Aguarda 4s
 * 
 * Só retenta em erros de servidor (5xx) ou timeout.
 * Não retenta em erros de cliente (4xx) - são permanentes.
 */

import { debugLog } from './feature-flags'
import { logger } from './logger'

/**
 * Opções de configuração do retry
 */
export interface RetryOptions {
  maxRetries?: number          // Número máximo de tentativas (padrão: 3)
  initialDelayMs?: number       // Delay inicial em ms (padrão: 1000)
  maxDelayMs?: number           // Delay máximo em ms (padrão: 10000)
  timeoutMs?: number            // Timeout por tentativa em ms (padrão: 30000)
  retryOn5xx?: boolean          // Retry em erros 5xx (padrão: true)
  retryOnTimeout?: boolean      // Retry em timeout (padrão: true)
  retryOnNetworkError?: boolean // Retry em erro de rede (padrão: true)
  onRetry?: (attempt: number, error: Error) => void // Callback antes de cada retry
}

/**
 * Resultado de uma chamada com retry
 */
export interface RetryResult<T> {
  success: boolean
  data?: T
  error?: Error
  attempts: number
  totalDuration: number
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Calcula o delay para o próximo retry (exponential backoff)
 */
function getBackoffDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number
): number {
  const delay = initialDelay * Math.pow(2, attempt - 1)
  return Math.min(delay, maxDelay)
}

/**
 * Verifica se um erro é retriável
 */
function isRetriableError(
  error: any,
  options: Required<RetryOptions>
): boolean {
  // Timeout
  if (error.name === 'AbortError' || error.message?.includes('timeout')) {
    return options.retryOnTimeout
  }
  
  // Erro de rede
  if (error.message?.includes('fetch failed') || error.code === 'ECONNREFUSED') {
    return options.retryOnNetworkError
  }
  
  // HTTP Response
  if (error.response) {
    const status = error.response.status
    
    // 5xx - Erro de servidor (retriável)
    if (status >= 500 && status < 600) {
      return options.retryOn5xx
    }
    
    // 4xx - Erro de cliente (NÃO retriável)
    if (status >= 400 && status < 500) {
      return false
    }
  }
  
  // Outros erros - retry por segurança
  return options.retryOnNetworkError
}

/**
 * Executa uma função com retry automático
 * 
 * USO:
 * ```typescript
 * const result = await retry(
 *   () => fetch('https://api.com/data'),
 *   { maxRetries: 3, timeoutMs: 5000 }
 * )
 * 
 * if (result.success) {
 *   console.log('Sucesso!', result.data)
 * } else {
 *   console.error('Falhou após', result.attempts, 'tentativas')
 * }
 * ```
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const config: Required<RetryOptions> = {
    maxRetries: options.maxRetries ?? 3,
    initialDelayMs: options.initialDelayMs ?? 1000,
    maxDelayMs: options.maxDelayMs ?? 10000,
    timeoutMs: options.timeoutMs ?? 30000,
    retryOn5xx: options.retryOn5xx ?? true,
    retryOnTimeout: options.retryOnTimeout ?? true,
    retryOnNetworkError: options.retryOnNetworkError ?? true,
    onRetry: options.onRetry ?? (() => {}),
  }
  
  const startTime = Date.now()
  let lastError: Error | undefined
  let attempts = 0
  
  for (let i = 0; i <= config.maxRetries; i++) {
    attempts++
    
    try {
      // Cria um timeout controller
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs)
      
      try {
        // Executa a função
        const result = await fn()
        clearTimeout(timeoutId)
        
        // Sucesso!
        return {
          success: true,
          data: result,
          attempts,
          totalDuration: Date.now() - startTime,
        }
      } catch (error: any) {
        clearTimeout(timeoutId)
        throw error
      }
    } catch (error: any) {
      lastError = error
      
      // Se não for a última tentativa e o erro for retriável, tenta novamente
      if (i < config.maxRetries && isRetriableError(error, config)) {
        const delay = getBackoffDelay(i + 1, config.initialDelayMs, config.maxDelayMs)
        
        logger.warn(`Tentativa ${i + 1}/${config.maxRetries + 1} falhou, retentando em ${delay}ms`, {
          error: error.message,
          attempt: i + 1,
          nextDelay: delay,
        })
        
        // Callback antes do retry
        config.onRetry(i + 1, error)
        
        // Aguarda antes de tentar novamente
        await sleep(delay)
        continue
      }
      
      // Erro não retriável ou última tentativa - falha definitiva
      logger.error(`Falha definitiva após ${attempts} tentativa(s)`, {
        error: error.message,
        attempts,
        duration: Date.now() - startTime,
      })
      
      break
    }
  }
  
  // Falhou após todas as tentativas
  return {
    success: false,
    error: lastError,
    attempts,
    totalDuration: Date.now() - startTime,
  }
}

/**
 * Helper: Retry específico para chamadas fetch
 * 
 * USO:
 * ```typescript
 * const result = await retryFetch('https://api.com/webhook', {
 *   method: 'POST',
 *   body: JSON.stringify(data),
 * })
 * ```
 */
export async function retryFetch(
  url: string,
  init?: RequestInit,
  retryOptions?: RetryOptions
): Promise<RetryResult<Response>> {
  return retry(
    async () => {
      const response = await fetch(url, init)
      
      // Se resposta não OK, lança erro para trigger retry
      if (!response.ok) {
        const error: any = new Error(`HTTP ${response.status}: ${response.statusText}`)
        error.response = response
        throw error
      }
      
      return response
    },
    retryOptions
  )
}

/**
 * Helper: Retry para chamadas N8N especificamente
 * 
 * USO:
 * ```typescript
 * const result = await retryN8N(N8N_WEBHOOK_URL, payload, {
 *   context: 'checkout-payment',
 *   orderId: '123',
 * })
 * ```
 */
export async function retryN8N<T = any>(
  webhookUrl: string,
  payload: any,
  context?: {
    context: string
    orderId?: string
    [key: string]: any
  }
): Promise<RetryResult<T>> {
  debugLog('webhook', `Chamando N8N com retry: ${webhookUrl}`, context)
  
  const result = await retryFetch(
    webhookUrl,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    {
      maxRetries: 3,
      timeoutMs: 30000, // 30s por tentativa
      onRetry: (attempt, error) => {
        debugLog('webhook', `N8N retry tentativa ${attempt}`, {
          error: error.message,
          ...context,
        })
      },
    }
  )
  
  if (result.success && result.data) {
    const jsonData = await result.data.json()
    
    debugLog('webhook', 'N8N respondeu com sucesso', {
      attempts: result.attempts,
      duration: result.totalDuration,
      ...context,
    })
    
    return {
      success: true,
      data: jsonData,
      attempts: result.attempts,
      totalDuration: result.totalDuration,
    }
  }
  
  logger.error('N8N falhou após todas as tentativas', {
    attempts: result.attempts,
    duration: result.totalDuration,
    error: result.error?.message,
    ...context,
  })
  
  return result as RetryResult<T>
}

export default retry

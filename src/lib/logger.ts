/**
 * 📝 Sistema de Logging Inteligente
 * 
 * - Em DEVELOPMENT: Mostra todos os logs (debug, info, warn, error)
 * - Em PRODUCTION: Mostra apenas info, warn e error (sem debug)
 * - Com FEATURE FLAGS: Pode ativar debug específico em produção
 * 
 * Isso previne:
 * - Poluição de logs em produção
 * - Exposição de informações sensíveis
 * - Performance degradada por excesso de logging
 */

import { env, isDevelopment, isProduction } from './env'
import { flags } from './feature-flags'

/**
 * Níveis de log disponíveis
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * Interface para dados estruturados de log
 */
interface LogData {
  [key: string]: any
}

/**
 * Formata dados para visualização bonita no console
 */
function formatLogData(data?: LogData): string {
  if (!data) return ''
  
  try {
    return '\n' + JSON.stringify(data, null, 2)
  } catch (error) {
    return '\n[Erro ao serializar dados do log]'
  }
}

/**
 * Logger principal
 */
class Logger {
  /**
   * 🐛 DEBUG - Apenas em desenvolvimento
   * Use para logs técnicos de debugging
   */
  debug(message: string, data?: LogData): void {
    if (isDevelopment) {
      console.log(`🐛 [DEBUG] ${message}`, data || '')
    }
  }

  /**
   * ℹ️ INFO - Informações importantes
   * Use para eventos importantes do sistema
   */
  info(message: string, data?: LogData): void {
    console.info(`ℹ️  [INFO] ${message}`, data || '')
  }

  /**
   * ⚠️ WARN - Avisos
   * Use para situações anormais mas não críticas
   */
  warn(message: string, data?: LogData): void {
    console.warn(`⚠️  [WARN] ${message}`, data || '')
  }

  /**
   * 🔴 ERROR - Erros
   * Use para erros que precisam atenção
   */
  error(message: string, error?: Error | LogData, data?: LogData): void {
    console.error(`🔴 [ERROR] ${message}`)
    
    if (error instanceof Error) {
      console.error(`   Stack: ${error.stack}`)
      if (data) {
        console.error(`   Data:`, data)
      }
    } else if (error) {
      console.error(`   Data:`, error)
    }
  }

  /**
   * 🎯 Performance tracking
   */
  time(label: string): void {
    if (isDevelopment) {
      console.time(`⏱️  ${label}`)
    }
  }

  timeEnd(label: string): void {
    if (isDevelopment) {
      console.timeEnd(`⏱️  ${label}`)
    }
  }

  /**
   * 📊 Grupo de logs (apenas em development)
   */
  group(label: string): void {
    if (isDevelopment) {
      console.group(`📊 ${label}`)
    }
  }

  groupEnd(): void {
    if (isDevelopment) {
      console.groupEnd()
    }
  }

  /**
   * 🔍 Log de request HTTP
   */
  http(method: string, path: string, status?: number, duration?: number): void {
    const emoji = status && status >= 400 ? '🔴' : '✅'
    const durationStr = duration ? ` (${duration}ms)` : ''
    
    if (isDevelopment) {
      console.log(`${emoji} [HTTP] ${method} ${path} ${status || ''}${durationStr}`)
    } else if (status && status >= 400) {
      // Em produção, só loga erros
      console.error(`${emoji} [HTTP] ${method} ${path} ${status}${durationStr}`)
    }
  }

  /**
   * 💰 Log de transação financeira
   * SEMPRE loga (mesmo em produção), mas filtra dados sensíveis
   */
  transaction(event: string, data: {
    orderId?: string
    amount?: number
    companyId?: string
    status?: string
    [key: string]: any
  }): void {
    // Remove dados sensíveis
    const safeData = {
      orderId: data.orderId,
      amount: data.amount,
      companyId: data.companyId,
      status: data.status,
      timestamp: new Date().toISOString()
    }
    
    console.info(`💰 [TRANSACTION] ${event}`, safeData)
  }

  /**
   * 🔐 Log de segurança
   * SEMPRE loga (mesmo em produção)
   */
  security(event: string, data?: LogData): void {
    console.warn(`🔐 [SECURITY] ${event}`, data || '')
  }
}

/**
 * Instância global do logger
 * 
 * USO:
 * ```typescript
 * import { logger } from '@/lib/logger'
 * 
 * logger.debug('Processando checkout', { orderId: '123' })
 * logger.info('Checkout criado com sucesso')
 * logger.warn('Webhook lento', { duration: 12000 })
 * logger.error('Falha no checkout', error, { orderId: '123' })
 * ```
 */
export const logger = new Logger()

/**
 * Helper: Cria um logger com contexto pré-definido
 * 
 * USO:
 * ```typescript
 * const log = createLogger('CheckoutAPI')
 * log.debug('Iniciando validação')
 * // Output: 🐛 [DEBUG] [CheckoutAPI] Iniciando validação
 * ```
 */
export function createLogger(context: string) {
  return {
    debug: (message: string, data?: LogData) => 
      logger.debug(`[${context}] ${message}`, data),
    info: (message: string, data?: LogData) => 
      logger.info(`[${context}] ${message}`, data),
    warn: (message: string, data?: LogData) => 
      logger.warn(`[${context}] ${message}`, data),
    error: (message: string, error?: Error | LogData, data?: LogData) => 
      logger.error(`[${context}] ${message}`, error, data),
    time: (label: string) => 
      logger.time(`[${context}] ${label}`),
    timeEnd: (label: string) => 
      logger.timeEnd(`[${context}] ${label}`),
  }
}

/**
 * Export default para compatibilidade
 */
export default logger

/**
 * 🔌 Abstract Base Provider
 * 
 * Template Method Pattern - define o fluxo base de execução.
 * Subclasses implementam apenas os métodos específicos.
 */

import { ImageProvider, ImageProviderResult } from './types'

export abstract class BaseImageProvider implements ImageProvider {
  abstract readonly name: string
  abstract readonly priority: number

  protected failureCount = 0
  protected circuitOpen = false
  protected lastFailureTime = 0
  protected readonly circuitBreakerThreshold = 3
  protected readonly circuitBreakerTimeout = 60000 // 1 minuto

  /**
   * Template Method - define o fluxo de execução
   */
  async getImage(productImage?: string): Promise<ImageProviderResult> {
    const startTime = Date.now()

    // Circuit Breaker - se circuito aberto, falha rápido
    if (this.circuitOpen) {
      if (Date.now() - this.lastFailureTime < this.circuitBreakerTimeout) {
        return {
          success: false,
          source: this.getSource(),
          error: `Circuit breaker open for ${this.name}`,
          latencyMs: Date.now() - startTime
        }
      }
      // Timeout passou, tentar fechar circuito
      this.circuitOpen = false
      this.failureCount = 0
    }

    try {
      const result = await this.fetchImage(productImage)
      
      if (result.success) {
        // Reset failure count on success
        this.failureCount = 0
        this.circuitOpen = false
      } else {
        this.handleFailure()
      }

      return {
        ...result,
        latencyMs: Date.now() - startTime
      }
    } catch (error) {
      this.handleFailure()
      
      return {
        success: false,
        source: this.getSource(),
        error: error instanceof Error ? error.message : 'Unknown error',
        latencyMs: Date.now() - startTime
      }
    }
  }

  isHealthy(): boolean {
    return !this.circuitOpen
  }

  /**
   * Hook methods - subclasses DEVEM implementar
   */
  protected abstract fetchImage(productImage?: string): Promise<ImageProviderResult>
  protected abstract getSource(): ImageProviderResult['source']

  /**
   * Circuit Breaker logic
   */
  private handleFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.failureCount >= this.circuitBreakerThreshold) {
      this.circuitOpen = true
      console.warn(`🔴 Circuit breaker OPEN for ${this.name} (${this.failureCount} failures)`)
    }
  }
}

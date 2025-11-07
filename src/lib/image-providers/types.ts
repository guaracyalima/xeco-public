/**
 * 🎨 Image Provider System - Types
 * 
 * Sistema de provedores de imagem com fallback em cascata.
 * Aplica Strategy Pattern + Circuit Breaker Pattern.
 */

export interface ImageProviderResult {
  success: boolean
  base64?: string
  source: 'product' | 'firebase' | 'public-url' | 'embedded-fallback'
  error?: string
  latencyMs?: number
}

export interface ImageProvider {
  readonly name: string
  readonly priority: number
  getImage(productImage?: string): Promise<ImageProviderResult>
  isHealthy(): boolean
}

export interface ImageProviderConfig {
  firebaseStorageUrl?: string
  publicImageUrl?: string
  enableCache: boolean
  cacheMaxAge: number // milliseconds
  circuitBreakerThreshold: number // failures antes de abrir circuito
  circuitBreakerTimeout: number // tempo antes de tentar novamente
}

export interface CachedImage {
  base64: string
  timestamp: number
  source: ImageProviderResult['source']
}

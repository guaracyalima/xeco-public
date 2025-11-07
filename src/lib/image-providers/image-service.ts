/**
 * 🏭 Image Service Factory + Manager
 * 
 * Singleton Pattern - única instância do serviço.
 * Strategy Pattern - escolhe provider baseado em prioridade.
 * Chain of Responsibility - tenta providers em cascata.
 */

import { ImageProvider, ImageProviderConfig, ImageProviderResult, CachedImage } from './types'
import { FirebaseStorageProvider } from './firebase-storage-provider'
import { PublicUrlProvider } from './public-url-provider'
import { EmbeddedFallbackProvider } from './embedded-fallback-provider'

export class ImageService {
  private static instance: ImageService | null = null
  private providers: ImageProvider[] = []
  private cache = new Map<string, CachedImage>()
  private config: ImageProviderConfig

  private constructor(config: Partial<ImageProviderConfig> = {}) {
    this.config = {
      firebaseStorageUrl: config.firebaseStorageUrl || process.env.NEXT_PUBLIC_DEFAULT_PRODUCT_IMAGE_URL,
      publicImageUrl: config.publicImageUrl || '/default-product-image.png',
      enableCache: config.enableCache ?? true,
      cacheMaxAge: config.cacheMaxAge ?? 3600000, // 1 hora
      circuitBreakerThreshold: config.circuitBreakerThreshold ?? 3,
      circuitBreakerTimeout: config.circuitBreakerTimeout ?? 60000 // 1 minuto
    }

    this.initializeProviders()
  }

  /**
   * Singleton getInstance
   */
  public static getInstance(config?: Partial<ImageProviderConfig>): ImageService {
    if (!ImageService.instance) {
      ImageService.instance = new ImageService(config)
    }
    return ImageService.instance
  }

  /**
   * Método principal - busca imagem com fallback em cascata
   */
  public async getProductImageBase64(productImage?: string): Promise<string> {
    const cacheKey = productImage || 'default'

    // 1. Verificar cache primeiro (se habilitado)
    if (this.config.enableCache) {
      const cached = this.getCachedImage(cacheKey)
      if (cached) {
        console.log(`✅ Cache HIT: ${cacheKey} (${cached.source})`)
        return cached.base64
      }
    }

    // 2. Tentar providers em ordem de prioridade
    const sortedProviders = this.getSortedHealthyProviders()

    for (const provider of sortedProviders) {
      console.log(`🔄 Trying ${provider.name} (priority ${provider.priority})...`)
      
      const result = await provider.getImage(productImage)

      if (result.success && result.base64) {
        console.log(`✅ ${provider.name} SUCCESS (${result.latencyMs}ms, source: ${result.source})`)
        
        // Cache result
        if (this.config.enableCache) {
          this.cacheImage(cacheKey, result.base64, result.source)
        }

        return result.base64
      }

      console.warn(`❌ ${provider.name} FAILED: ${result.error} (${result.latencyMs}ms)`)
    }

    // 3. Se TUDO falhou (impossível com EmbeddedFallback), usar imagem 1x1 emergência
    // ⚠️ JPEG para compatibilidade com Asaas/N8N
    console.error('🚨 ALL providers failed - usando imagem 1x1 emergência')
    return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlbaWmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD+/iiiigD/2Q=='
  }

  /**
   * Health check - retorna status de todos os providers
   */
  public getProvidersHealth(): Record<string, boolean> {
    return this.providers.reduce((acc, provider) => {
      acc[provider.name] = provider.isHealthy()
      return acc
    }, {} as Record<string, boolean>)
  }

  /**
   * Limpar cache manualmente
   */
  public clearCache(): void {
    this.cache.clear()
    console.log('🧹 Image cache cleared')
  }

  /**
   * Estatísticas do cache
   */
  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }

  // ========== PRIVATE METHODS ==========

  private initializeProviders(): void {
    // Adicionar providers em qualquer ordem - eles serão ordenados por priority
    
    // 1. Firebase Storage (priority 1)
    if (this.config.firebaseStorageUrl) {
      this.providers.push(new FirebaseStorageProvider(this.config.firebaseStorageUrl))
    }

    // 2. Public URL (priority 2)
    if (this.config.publicImageUrl) {
      this.providers.push(new PublicUrlProvider(this.config.publicImageUrl))
    }

    // 3. Embedded fallback (priority 99) - SEMPRE adicionar
    this.providers.push(new EmbeddedFallbackProvider())

    console.log(`🏭 ImageService initialized with ${this.providers.length} providers:`, 
      this.providers.map(p => `${p.name}(${p.priority})`).join(', ')
    )
  }

  private getSortedHealthyProviders(): ImageProvider[] {
    return this.providers
      .filter(p => p.isHealthy())
      .sort((a, b) => a.priority - b.priority) // Lower priority number = higher priority
  }

  private getCachedImage(key: string): CachedImage | null {
    const cached = this.cache.get(key)
    
    if (!cached) {
      return null
    }

    // Verificar se cache expirou
    const age = Date.now() - cached.timestamp
    if (age > this.config.cacheMaxAge) {
      this.cache.delete(key)
      return null
    }

    return cached
  }

  private cacheImage(key: string, base64: string, source: ImageProviderResult['source']): void {
    this.cache.set(key, {
      base64,
      timestamp: Date.now(),
      source
    })
  }
}

/**
 * 🎯 Helper function - uso simplificado
 */
export async function getProductImageBase64(productImage?: string): Promise<string> {
  const service = ImageService.getInstance()
  return service.getProductImageBase64(productImage)
}

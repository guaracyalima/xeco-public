/**
 * 📦 Image Providers - Public API
 * 
 * Exporta apenas o necessário para uso externo.
 * Encapsula implementação interna.
 */

export { getProductImageBase64, ImageService } from './image-service'
export type { ImageProviderResult, ImageProviderConfig } from './types'

/**
 * 🎯 Uso Recomendado:
 * 
 * ```typescript
 * import { getProductImageBase64 } from '@/lib/image-providers'
 * 
 * // Em checkout API:
 * const imageBase64 = await getProductImageBase64(product.image)
 * ```
 * 
 * 🔧 Configuração Avançada:
 * 
 * ```typescript
 * import { ImageService } from '@/lib/image-providers'
 * 
 * const service = ImageService.getInstance({
 *   firebaseStorageUrl: 'https://...',
 *   enableCache: true,
 *   cacheMaxAge: 3600000
 * })
 * 
 * const base64 = await service.getProductImageBase64(product.image)
 * const health = service.getProvidersHealth()
 * ```
 */

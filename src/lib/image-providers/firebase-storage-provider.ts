/**
 * 🔥 Firebase Storage Provider
 * 
 * Busca imagem do Firebase Storage.
 * Priority: 1 (highest - CDN rápida e confiável)
 */

import { BaseImageProvider } from './base-provider'
import { ImageProviderResult } from './types'

export class FirebaseStorageProvider extends BaseImageProvider {
  readonly name = 'FirebaseStorage'
  readonly priority = 1

  constructor(private readonly defaultImageUrl: string) {
    super()
  }

  protected async fetchImage(productImage?: string): Promise<ImageProviderResult> {
    // Se produto tem imagem própria, usar ela
    if (productImage && this.isValidImageUrl(productImage)) {
      try {
        const base64 = await this.fetchAndConvertToBase64(productImage)
        return {
          success: true,
          base64,
          source: 'product'
        }
      } catch (error) {
        console.warn(`⚠️ Failed to fetch product image: ${productImage}`, error)
        // Continue para buscar imagem padrão
      }
    }

    // Buscar imagem padrão do Firebase Storage
    try {
      const base64 = await this.fetchAndConvertToBase64(this.defaultImageUrl)
      return {
        success: true,
        base64,
        source: 'firebase'
      }
    } catch (error) {
      return {
        success: false,
        source: 'firebase',
        error: error instanceof Error ? error.message : 'Failed to fetch from Firebase'
      }
    }
  }

  protected getSource(): ImageProviderResult['source'] {
    return 'firebase'
  }

  private isValidImageUrl(url: string): boolean {
    try {
      const parsed = new URL(url)
      return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch {
      return false
    }
  }

  private async fetchAndConvertToBase64(url: string): Promise<string> {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000) // 10s timeout
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString('base64')

    // Detectar MIME type da resposta
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    
    return `data:${contentType};base64,${base64}`
  }
}

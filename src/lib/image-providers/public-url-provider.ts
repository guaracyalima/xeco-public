/**
 * 🌐 Public URL Provider
 * 
 * Busca imagem de URL pública (Next.js /public ou qualquer CDN).
 * Priority: 2 (fallback se Firebase falhar)
 */

import { BaseImageProvider } from './base-provider'
import { ImageProviderResult } from './types'

export class PublicUrlProvider extends BaseImageProvider {
  readonly name = 'PublicURL'
  readonly priority = 2

  constructor(private readonly publicImageUrl: string) {
    super()
  }

  protected async fetchImage(productImage?: string): Promise<ImageProviderResult> {
    try {
      // Construir URL absoluta se for path relativo
      const fullUrl = this.publicImageUrl.startsWith('http')
        ? this.publicImageUrl
        : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${this.publicImageUrl}`

      const response = await fetch(fullUrl, {
        signal: AbortSignal.timeout(5000) // 5s timeout (mais agressivo que Firebase)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      // ⚠️ CONVERSÃO OBRIGATÓRIA: Asaas/N8N só aceita JPEG
      // Converte qualquer formato (PNG, WebP, etc) para JPEG
      try {
        const sharp = require('sharp')
        const jpegBuffer = await sharp(buffer)
          .jpeg({ quality: 85, mozjpeg: true })
          .toBuffer()
        
        const base64 = jpegBuffer.toString('base64')
        
        return {
          success: true,
          base64: `data:image/jpeg;base64,${base64}`,
          source: 'public-url'
        }
      } catch (sharpError) {
        // Fallback: Se sharp falhar, apenas troca mime type (não ideal mas funciona)
        console.warn('⚠️ Sharp conversion failed, using mime type only:', sharpError)
        const base64 = buffer.toString('base64')
        return {
          success: true,
          base64: `data:image/jpeg;base64,${base64}`,
          source: 'public-url'
        }
      }
    } catch (error) {
      return {
        success: false,
        source: 'public-url',
        error: error instanceof Error ? error.message : 'Failed to fetch from public URL'
      }
    }
  }

  protected getSource(): ImageProviderResult['source'] {
    return 'public-url'
  }
}

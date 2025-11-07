/**
 * 💾 Embedded Fallback Provider
 * 
 * SEMPRE sucede - imagem embedded no código (último recurso).
 * Priority: 99 (lowest - só usa se tudo falhar)
 * 
 * Esta é uma imagem 400x400px JPEG otimizada (~8KB) de um placeholder.
 * Gerada uma única vez e embedada no código.
 */

import { BaseImageProvider } from './base-provider'
import { ImageProviderResult } from './types'

/**
 * Imagem padrão 400x400px JPEG (gradient cinza com ícone)
 * Substituir esta string com a imagem real gerada:
 * 
 * 1. Criar imagem 400x400px no Figma/Photoshop
 * 2. Exportar como JPEG quality 85%
 * 3. Converter: `cat image.jpg | base64`
 * 4. Colar aqui com prefixo data:image/jpeg;base64,
 */
const EMBEDDED_DEFAULT_IMAGE = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAGQAZADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlbaWmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD+/iiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD/2Q=='

export class EmbeddedFallbackProvider extends BaseImageProvider {
  readonly name = 'EmbeddedFallback'
  readonly priority = 99 // Lowest priority - último recurso

  protected async fetchImage(_productImage?: string): Promise<ImageProviderResult> {
    // SEMPRE retorna sucesso - é o fallback final
    return {
      success: true,
      base64: EMBEDDED_DEFAULT_IMAGE,
      source: 'embedded-fallback'
    }
  }

  protected getSource(): ImageProviderResult['source'] {
    return 'embedded-fallback'
  }

  // Embedded fallback SEMPRE está saudável
  isHealthy(): boolean {
    return true
  }
}

/**
 * 🎨 Como gerar uma nova imagem embedded:
 * 
 * 1. Criar no Figma/Photoshop:
 *    - 400x400px
 *    - Fundo: gradient #E5E7EB → #D1D5DB
 *    - Ícone: shopping bag ou package (cinza escuro)
 *    - Texto: "Sem imagem" (opcional)
 * 
 * 2. Exportar como JPEG:
 *    - Quality: 85%
 *    - Progressive: true
 * 
 * 3. Converter para base64:
 *    ```bash
 *    cat default-product.jpg | base64 | tr -d '\n'
 *    ```
 * 
 * 4. Substituir a constante EMBEDDED_DEFAULT_IMAGE acima
 *    - Incluir prefixo: data:image/jpeg;base64,
 * 
 * 5. Verificar tamanho:
 *    - Ideal: < 15KB
 *    - Máximo aceitável: < 30KB
 */

import sharp from 'sharp'

/**
 * Imagem placeholder 1x1 transparente em PNG (apenas base64)
 */
const PLACEHOLDER_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

/**
 * Timeout para download de imagem (5 segundos)
 */
const IMAGE_DOWNLOAD_TIMEOUT = 5000

/**
 * Converte uma URL de imagem para base64 PURO em JPEG (sem data URL prefix)
 * CONVERTE TODOS OS FORMATOS (PNG, WEBP, GIF) → JPEG antes de base64
 * Ideal para APIs como Asaas que só aceitam JPEG
 * @param url URL da imagem
 * @returns String base64 pura (JPEG) ou placeholder se falhar
 */
export async function imageUrlToBase64(url: string): Promise<string> {
  console.log('🖼️ Convertendo imagem para base64:', url)
  
  // Validações básicas
  if (!url) {
    console.warn('⚠️ URL da imagem não fornecida, usando placeholder')
    return PLACEHOLDER_BASE64
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    console.warn('⚠️ URL da imagem inválida, usando placeholder')
    return PLACEHOLDER_BASE64
  }

  try {
    // Promise com timeout
    const downloadPromise = fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'image/*',
      },
      signal: AbortSignal.timeout(IMAGE_DOWNLOAD_TIMEOUT)
    })

    console.log('📥 Baixando imagem da URL (timeout: 5s):', url)
    const response = await downloadPromise

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    // Lê o conteúdo da imagem como ArrayBuffer
    const arrayBuffer = await response.arrayBuffer()
    
    // Converte para Buffer do Node.js
    const buffer = Buffer.from(arrayBuffer)
    
    // Pega o content-type da resposta
    const contentType = response.headers.get('content-type') || 'image/png'
    
    console.log('✅ Imagem baixada:', {
      contentType,
      sizeKB: (buffer.length / 1024).toFixed(2),
      originalFormat: contentType.split('/')[1]?.toUpperCase()
    })
    
    // 🔥 CONVERTE PARA JPEG COM SHARP (comprime e normaliza formato)
    console.log('🔄 Convertendo para JPEG com qualidade 85%...')
    const jpegBuffer = await sharp(buffer)
      .jpeg({
        quality: 85, // Qualidade alta mas comprime bem
        progressive: true,
        mozjpeg: true // Usa mozjpeg para melhor compressão
      })
      .resize(800, 800, { // Redimensiona pra no máximo 800x800 (mantém aspect ratio)
        fit: 'inside',
        withoutEnlargement: true // Não aumenta imagens pequenas
      })
      .toBuffer()
    
    // Valida tamanho APÓS conversão (máximo 500KB)
    const finalSizeKB = jpegBuffer.length / 1024
    if (finalSizeKB > 500) {
      console.warn(`⚠️ Imagem JPEG ainda muito grande (${finalSizeKB.toFixed(2)} KB), reduzindo qualidade...`)
      // Tenta novamente com qualidade menor
      const smallerBuffer = await sharp(buffer)
        .jpeg({ quality: 60, progressive: true, mozjpeg: true })
        .resize(600, 600, { fit: 'inside', withoutEnlargement: true })
        .toBuffer()
      
      const smallerSizeKB = smallerBuffer.length / 1024
      if (smallerSizeKB > 500) {
        console.warn(`⚠️ Imagem ainda grande (${smallerSizeKB.toFixed(2)} KB), usando placeholder`)
        return PLACEHOLDER_BASE64
      }
      
      console.log('✅ Imagem comprimida:', {
        originalKB: (buffer.length / 1024).toFixed(2),
        finalKB: smallerSizeKB.toFixed(2),
        reduction: `${(100 - (smallerSizeKB / (buffer.length / 1024)) * 100).toFixed(1)}%`,
        format: 'JPEG'
      })
      
      const base64 = smallerBuffer.toString('base64')
      console.log('✅ Base64 JPEG gerado (tamanho:', base64.length, 'chars)')
      return base64
    }
    
    console.log('✅ Imagem convertida para JPEG:', {
      originalKB: (buffer.length / 1024).toFixed(2),
      finalKB: finalSizeKB.toFixed(2),
      reduction: `${(100 - (finalSizeKB / (buffer.length / 1024)) * 100).toFixed(1)}%`,
      format: 'JPEG'
    })
    
    // Converte para base64 PURO (sem prefixo data:image)
    const base64 = jpegBuffer.toString('base64')
    
    console.log('✅ Base64 JPEG gerado (tamanho:', base64.length, 'chars)')
    
    return base64
  } catch (error: any) {
    const errorMsg = error?.message || 'Erro desconhecido'
    console.warn(`⚠️ Falha ao converter imagem (${errorMsg}), usando placeholder:`, url)
    return PLACEHOLDER_BASE64
  }
}

/**
 * Converter múltiplas imagens em paralelo
 */
export async function imagesToBase64(imageUrls: string[]): Promise<string[]> {
  return Promise.all(imageUrls.map(imageUrlToBase64))
}

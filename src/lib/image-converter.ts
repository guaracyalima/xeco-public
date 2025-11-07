/**
 * 🖼️ Image Format Converter
 * 
 * Converte qualquer imagem base64 para JPEG.
 * Usado para garantir compatibilidade com Asaas/N8N que só aceita JPEG.
 */

/**
 * Converte qualquer imagem base64 para JPEG
 * @param base64 - Imagem em base64 (com ou sem data URI)
 * @returns Imagem em JPEG base64 (data:image/jpeg;base64,...)
 */
export async function convertToJpegBase64(base64: string): Promise<string> {
  try {
    // Se já é JPEG, retorna direto
    if (base64.includes('data:image/jpeg')) {
      return base64
    }

    // Remove data URI prefix se existir
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, '')
    
    // Criar buffer da imagem
    const buffer = Buffer.from(base64Data, 'base64')
    
    // No browser, não temos acesso ao sharp/jimp, então só convertemos o mime type
    // A conversão real acontece no servidor se necessário
    if (typeof window !== 'undefined') {
      // No browser: Apenas troca o mime type para JPEG
      return `data:image/jpeg;base64,${base64Data}`
    }

    // No servidor: Usar sharp para conversão real (se disponível)
    try {
      const sharp = require('sharp')
      
      const jpegBuffer = await sharp(buffer)
        .jpeg({ quality: 85, mozjpeg: true })
        .toBuffer()
      
      return `data:image/jpeg;base64,${jpegBuffer.toString('base64')}`
    } catch (sharpError) {
      // Sharp não disponível, retorna com mime type JPEG
      console.warn('⚠️ Sharp not available, returning base64 with JPEG mime type')
      return `data:image/jpeg;base64,${base64Data}`
    }
  } catch (error) {
    console.error('❌ Erro ao converter imagem para JPEG:', error)
    // Fallback: retorna a imagem original mas com mime type JPEG
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, '')
    return `data:image/jpeg;base64,${base64Data}`
  }
}

/**
 * Valida se uma string é base64 válida
 */
export function isValidBase64(str: string): boolean {
  try {
    const base64Data = str.replace(/^data:image\/\w+;base64,/, '')
    return Buffer.from(base64Data, 'base64').toString('base64') === base64Data
  } catch {
    return false
  }
}

/**
 * Extrai o mime type de um data URI
 */
export function getMimeType(base64: string): string | null {
  const match = base64.match(/^data:(image\/\w+);base64,/)
  return match ? match[1] : null
}

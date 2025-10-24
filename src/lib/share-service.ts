// Serviço de compartilhamento estilo Shopee
// Gera imagem com informações e compartilha

import { Product, Company } from '@/types'
import QRCode from 'qrcode'

interface ShareProductData {
  type: 'product'
  data: Product
  companyName?: string
}

interface ShareCompanyData {
  type: 'company'
  data: Company
}

type ShareData = ShareProductData | ShareCompanyData

/**
 * Gera uma imagem canvas com as informações do produto/empresa
 */
async function generateShareImage(shareData: ShareData): Promise<Blob> {
  // Criar canvas
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  
  // Dimensões da imagem (formato WhatsApp otimizado)
  canvas.width = 600
  canvas.height = 800
  
  // Background branco
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  try {
    // Carregar imagem do produto/empresa
    const imageUrl = shareData.type === 'product' 
      ? (shareData.data.imagesUrl?.[0] || '/default-product-image.png')
      : (shareData.data.logo || '/default-fail-image.jpg')
    
    const img = await loadImage(imageUrl)
    
    // Desenhar imagem no topo (quadrada, centralizada)
    const imgSize = 600
    const imgY = 0
    ctx.drawImage(img, 0, imgY, imgSize, imgSize)
    
    // 🔖 MARCAS D'ÁGUA espalhadas pela imagem (pra não cortarem)
    ctx.save()
    
    // Configurar sombra pra marca d'água funcionar em fundo claro E escuro
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
    ctx.shadowBlur = 8
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2
    
    ctx.globalAlpha = 0.35
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 48px system-ui, -apple-system, sans-serif'
    
    // Marca d'água no topo esquerdo
    ctx.fillText('Xeco', 30, 80)
    
    // Marca d'água no meio direito
    ctx.fillText('Xeco', 420, 320)
    
    // Marca d'água no centro (levemente rotacionada)
    ctx.save()
    ctx.translate(280, 250)
    ctx.rotate(-20 * Math.PI / 180)
    ctx.fillText('Xeco', 0, 0)
    ctx.restore()
    
    // Marca d'água embaixo esquerdo
    ctx.fillText('Xeco', 40, 520)
    
    ctx.restore()
    
    // Área de informações (fundo branco com sombra)
    const infoY = imgSize
    const infoHeight = canvas.height - imgSize
    
    // Sombra sutil
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)'
    ctx.shadowBlur = 10
    ctx.shadowOffsetY = -5
    
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, infoY, canvas.width, infoHeight)
    
    // Resetar sombra
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0
    
    // Padding interno
    const padding = 24
    let currentY = infoY + padding
    
    if (shareData.type === 'product') {
      // PRODUTO
      const product = shareData.data
      
      // Nome do produto (2 linhas max)
      ctx.fillStyle = '#1F2937'
      ctx.font = 'bold 24px system-ui, -apple-system, sans-serif'
      const nameLines = wrapText(ctx, product.name, canvas.width - padding * 2, 2)
      nameLines.forEach(line => {
        ctx.fillText(line, padding, currentY)
        currentY += 32
      })
      
      currentY += 8
      
            // Price (only for products)
      ctx.fillStyle = '#FB6F72'
      ctx.font = 'bold 32px system-ui, -apple-system, sans-serif'
      const priceValue = typeof product.salePrice === 'number' 
        ? product.salePrice 
        : parseFloat(String(product.salePrice) || '0')
      const price = `R$ ${priceValue.toFixed(2).replace('.', ',')}`
      ctx.fillText(price, padding, currentY)
      currentY += 48
      
      // Descrição (1 linha)
      if (product.description) {
        ctx.fillStyle = '#6B7280'
        ctx.font = '16px system-ui, -apple-system, sans-serif'
        const desc = truncateText(ctx, product.description, canvas.width - padding * 2)
        ctx.fillText(desc, padding, currentY)
        currentY += 24
      }
      
      // Nome da empresa (se houver)
      if (shareData.companyName) {
        ctx.fillStyle = '#9CA3AF'
        ctx.font = '14px system-ui, -apple-system, sans-serif'
        ctx.fillText(`Vendido por: ${shareData.companyName}`, padding, currentY)
        currentY += 20
      }
    } else {
      // EMPRESA
      const company = shareData.data
      
      // Nome da empresa (2 linhas max)
      ctx.fillStyle = '#1F2937'
      ctx.font = 'bold 28px system-ui, -apple-system, sans-serif'
      const nameLines = wrapText(ctx, company.name, canvas.width - padding * 2, 2)
      nameLines.forEach(line => {
        ctx.fillText(line, padding, currentY)
        currentY += 36
      })
      
      currentY += 12
      
      // About (descrição da empresa)
      if (company.about) {
        ctx.fillStyle = '#6B7280'
        ctx.font = '16px system-ui, -apple-system, sans-serif'
        const descLines = wrapText(ctx, company.about, canvas.width - padding * 2, 2)
        descLines.forEach(line => {
          ctx.fillText(line, padding, currentY)
          currentY += 24
        })
      }
      
      currentY += 8
      
      // Localização
      if (company.city && company.state) {
        ctx.fillStyle = '#9CA3AF'
        ctx.font = '14px system-ui, -apple-system, sans-serif'
        ctx.fillText(`📍 ${company.city}, ${company.state}`, padding, currentY)
      }
    }
    
    // 🔲 QR Code no canto inferior direito
    try {
      const url = shareData.type === 'product' 
        ? `${window.location.origin}/produto/${shareData.data.id}`
        : `${window.location.origin}/company/${shareData.data.id}`
      
      // Gerar QR Code como data URL
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 100,
        margin: 1,
        color: {
          dark: '#1F2937',
          light: '#FFFFFF'
        }
      })
      
      // Criar imagem do QR Code (data URL não precisa de crossOrigin)
      const qrImage = new Image()
      await new Promise<void>((resolve, reject) => {
        qrImage.onload = () => resolve()
        qrImage.onerror = () => reject(new Error('Erro ao carregar QR Code'))
        qrImage.src = qrDataUrl
      })
      
      // Posição do QR Code (canto inferior direito)
      const qrSize = 80
      const qrPadding = 15
      const qrX = canvas.width - qrSize - qrPadding
      const qrY = canvas.height - qrSize - qrPadding
      
      // Fundo branco para o QR Code
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10)
      
      // Borda ao redor do QR Code
      ctx.strokeStyle = '#E5E7EB'
      ctx.lineWidth = 2
      ctx.strokeRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10)
      
      // Desenhar QR Code
      ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize)
      
    } catch (qrError) {
      console.warn('⚠️ Erro ao gerar QR Code:', qrError)
      // Continua sem o QR Code se der erro
    }
    
  } catch (error) {
    console.error('Erro ao gerar imagem de compartilhamento:', error)
    
    // Fallback: texto simples
    ctx.fillStyle = '#1F2937'
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif'
    ctx.fillText(
      shareData.type === 'product' ? shareData.data.name : shareData.data.name,
      20,
      canvas.height / 2
    )
  }
  
  // Converter canvas para blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Falha ao criar blob da imagem'))
        }
      },
      'image/jpeg',
      0.95
    )
  })
}

/**
 * Carregar imagem de URL
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => resolve(img)
    img.onerror = () => {
      // Fallback para imagem padrão
      const fallbackImg = new Image()
      fallbackImg.src = '/default-product-image.png'
      fallbackImg.onload = () => resolve(fallbackImg)
      fallbackImg.onerror = () => reject(new Error('Falha ao carregar imagem'))
    }
    
    // Adicionar timestamp para evitar cache
    img.src = url.includes('?') ? `${url}&t=${Date.now()}` : `${url}?t=${Date.now()}`
  })
}

/**
 * Quebrar texto em múltiplas linhas
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number = 2
): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const metrics = ctx.measureText(testLine)
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
      
      if (lines.length >= maxLines) {
        break
      }
    } else {
      currentLine = testLine
    }
  }
  
  if (currentLine && lines.length < maxLines) {
    // Adicionar reticências se cortou texto
    if (lines.length === maxLines - 1 && words.length > lines.join(' ').split(' ').length) {
      currentLine = currentLine + '...'
    }
    lines.push(currentLine)
  }
  
  return lines
}

/**
 * Truncar texto com reticências
 */
function truncateText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  let truncated = text
  let metrics = ctx.measureText(truncated)
  
  while (metrics.width > maxWidth && truncated.length > 0) {
    truncated = truncated.slice(0, -1)
    metrics = ctx.measureText(truncated + '...')
  }
  
  return metrics.width > maxWidth ? truncated : truncated + '...'
}

/**
 * Compartilhar produto estilo Shopee
 */
export async function shareProduct(
  product: Product,
  companyName?: string
): Promise<boolean> {
  try {
    console.log('📤 Iniciando compartilhamento de produto:', product.name)
    
    // Gerar imagem SEMPRE
    console.log('🎨 Gerando imagem de compartilhamento...')
    const imageBlob = await generateShareImage({
      type: 'product',
      data: product,
      companyName
    })
    
    // Criar arquivo da imagem
    const imageFile = new File(
      [imageBlob],
      `${product.name.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`,
      { type: 'image/jpeg' }
    )
    
    // URL do produto
    const productUrl = `${window.location.origin}/produto/${product.id}`
    
    // Montar texto do compartilhamento (estilo Shopee - fluido e natural)
    const priceValue = typeof product.salePrice === 'number' 
      ? product.salePrice 
      : parseFloat(String(product.salePrice) || '0')
    
    const shareText = `Confira ${product.name} por R$${priceValue.toFixed(2).replace('.', ',')}. ${
      companyName ? `Vendido por ${companyName}. ` : ''
    }Encontre na Xeco agora! ${productUrl}`
    
    // Verificar se Web Share API está disponível E suporta arquivos
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [imageFile] })) {
      try {
        // Compartilhar com imagem via API nativa
        await navigator.share({
          files: [imageFile],
          title: product.name,
          text: shareText
        })
        
        console.log('✅ Produto compartilhado com imagem via API nativa')
        
        // Analytics
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'share', {
            content_type: 'product',
            item_id: product.id,
            method: 'web_share_api'
          })
        }
        
        return true
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('ℹ️ Usuário cancelou o compartilhamento')
          return false
        }
        console.warn('⚠️ Erro ao usar Web Share API:', error.message)
        // Continua para o fallback
      }
    }
    
    // FALLBACK: Download da imagem + copiar texto
    console.log('📥 Usando fallback: download da imagem')
    
    // Fazer download da imagem
    const url = URL.createObjectURL(imageBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `xeco-${product.name.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    // Copiar texto + link para clipboard
    await navigator.clipboard.writeText(shareText)
    
    // Mostrar alerta com instruções
    alert('🎉 Imagem baixada!\n\n📋 Texto copiado para área de transferência!\n\n👉 Agora é só compartilhar a imagem e colar o texto no WhatsApp, Instagram, etc!')
    
    console.log('✅ Imagem baixada e texto copiado')
    
    // Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'share', {
        content_type: 'product',
        item_id: product.id,
        method: 'download_fallback'
      })
    }
    
    return true
  } catch (error: any) {
    console.error('❌ Erro ao compartilhar produto:', error)
    alert('❌ Erro ao gerar imagem. Tente novamente.')
    return false
  }
}

/**
 * Compartilhar empresa estilo Shopee
 */
export async function shareCompany(company: Company): Promise<boolean> {
  try {
    console.log('📤 Iniciando compartilhamento de empresa:', company.name)
    
    // Gerar imagem SEMPRE
    console.log('🎨 Gerando imagem de compartilhamento...')
    const imageBlob = await generateShareImage({
      type: 'company',
      data: company
    })
    
    // Criar arquivo da imagem
    const imageFile = new File(
      [imageBlob],
      `${company.name.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`,
      { type: 'image/jpeg' }
    )
    
    // URL da empresa
    const companyUrl = `${window.location.origin}/company/${company.id}`
    
    // Montar texto do compartilhamento (estilo Shopee - fluido e natural)
    const locationText = company.city && company.state ? ` em ${company.city}, ${company.state}` : ''
    const shareText = `Confira ${company.name}${locationText}. Encontre na Xeco agora! ${companyUrl}`
    
    // Verificar se Web Share API está disponível E suporta arquivos
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [imageFile] })) {
      try {
        // Compartilhar com imagem via API nativa
        await navigator.share({
          files: [imageFile],
          title: company.name,
          text: shareText
        })
        
        console.log('✅ Empresa compartilhada com imagem via API nativa')
        
        // Analytics
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'share', {
            content_type: 'company',
            item_id: company.id,
            method: 'web_share_api'
          })
        }
        
        return true
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('ℹ️ Usuário cancelou o compartilhamento')
          return false
        }
        console.warn('⚠️ Erro ao usar Web Share API:', error.message)
        // Continua para o fallback
      }
    }
    
    // FALLBACK: Download da imagem + copiar texto
    console.log('📥 Usando fallback: download da imagem')
    
    // Fazer download da imagem
    const url = URL.createObjectURL(imageBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `xeco-${company.name.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    // Copiar texto + link para clipboard
    await navigator.clipboard.writeText(shareText)
    
    // Mostrar alerta com instruções
    alert('🎉 Imagem baixada!\n\n📋 Texto copiado para área de transferência!\n\n👉 Agora é só compartilhar a imagem e colar o texto no WhatsApp, Instagram, etc!')
    
    console.log('✅ Imagem baixada e texto copiado')
    
    // Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'share', {
        content_type: 'company',
        item_id: company.id,
        method: 'download_fallback'
      })
    }
    
    return true
  } catch (error: any) {
    console.error('❌ Erro ao compartilhar empresa:', error)
    alert('❌ Erro ao gerar imagem. Tente novamente.')
    return false
  }
}

/**
 * Fallback: copiar link para clipboard
 */
async function fallbackCopyLink(
  type: 'product' | 'company',
  id: string
): Promise<void> {
  try {
    const url = `${window.location.origin}/${type === 'product' ? 'produto' : 'company'}/${id}`
    
    await navigator.clipboard.writeText(url)
    
    alert('✅ Link copiado para a área de transferência!')
    
    console.log('📋 Link copiado como fallback')
  } catch (error) {
    console.error('❌ Erro ao copiar link:', error)
    alert('❌ Não foi possível compartilhar. Por favor, copie o link manualmente.')
  }
}

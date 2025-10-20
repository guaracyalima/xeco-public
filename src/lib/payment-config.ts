/**
 * Configurações para o sistema de pagamentos e split
 */

// Taxa da plataforma (em porcentagem)
export const PLATFORM_FEE_PERCENTAGE = 8

// Configurações do Asaas
export const ASAAS_CONFIG = {
  // Tamanho máximo da imagem em base64 (em bytes)
  MAX_IMAGE_SIZE: 1024 * 1024, // 1MB
  
  // Qualidade da compressão de imagem (0-1)
  IMAGE_QUALITY: 0.8,
  
  // Formato de imagem aceito
  IMAGE_FORMAT: 'image/jpeg'
} as const

// Tipos para os splits
export interface PaymentSplit {
  walletId: string
  percentageValue: number
}

export interface SplitCalculation {
  platformFee: number
  affiliateCommission: number
  storeAmount: number
  splits: PaymentSplit[]
}

/**
 * Calcula os splits do pagamento
 */
export function calculatePaymentSplits(
  totalAmount: number,
  storeWalletId: string,
  affiliateData?: {
    walletId: string
    commissionPercentage: number
  }
): SplitCalculation {
  // Taxa da plataforma (fixo)
  const platformFee = (totalAmount * PLATFORM_FEE_PERCENTAGE) / 100
  
  // Comissão do afiliado (se existir)
  const affiliateCommission = affiliateData 
    ? (totalAmount * affiliateData.commissionPercentage) / 100 
    : 0
  
  // Valor restante para a loja
  const storeAmount = totalAmount - platformFee - affiliateCommission
  
  // Monta os splits apenas para quem recebe valor
  const splits: PaymentSplit[] = []
  
  // Adiciona split do afiliado se existir
  if (affiliateData && affiliateCommission > 0) {
    splits.push({
      walletId: affiliateData.walletId,
      percentageValue: affiliateData.commissionPercentage
    })
  }
  
  // A loja sempre recebe o restante (não precisa estar nos splits explicitamente 
  // se ela for o beneficiário principal no Asaas)
  
  return {
    platformFee,
    affiliateCommission,
    storeAmount,
    splits
  }
}

/**
 * Converte uma URL de imagem para base64
 */
export async function convertImageToBase64(imageUrl: string): Promise<string> {
  try {
    console.log('🖼️ Convertendo imagem para base64:', imageUrl)
    
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Erro ao buscar imagem: ${response.status}`)
    }
    
    const blob = await response.blob()
    
    // Verifica tamanho
    if (blob.size > ASAAS_CONFIG.MAX_IMAGE_SIZE) {
      console.warn('⚠️ Imagem muito grande, pode ser necessário comprimir')
    }
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result as string
        // Remove o prefixo "data:image/...;base64," se existir
        const base64Data = base64.includes(',') ? base64.split(',')[1] : base64
        resolve(base64Data)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('❌ Erro ao converter imagem para base64:', error)
    // Retorna string vazia em caso de erro para não quebrar o processo
    return ''
  }
}
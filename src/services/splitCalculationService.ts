/**
 * Serviço para Cálculo de Splits de Pagamento
 */

export interface SplitConfig {
  companyWalletId: string
  affiliateWalletId?: string
  discountPercentage?: number
  totalAmount: number
}

export interface SplitCalculationResult {
  platformFeePercentage: number
  platformFeeAmount: number
  companyPercentage: number
  companyAmount: number
  affiliatePercentage: number
  affiliateAmount: number
  splits: Array<{
    walletId: string
    percentageValue: number
  }>
}

/**
 * Calcula os splits de pagamento conforme as regras:
 * - 8% para a plataforma
 * - Se não houver cupom de afiliado: 92% para a empresa
 * - Se houver cupom de afiliado: (92 - discountValue)% para a empresa e discountValue% para o afiliado
 */
export function calculateSplits(config: SplitConfig): SplitCalculationResult {
  const { companyWalletId, affiliateWalletId, discountPercentage = 0, totalAmount } = config

  // 8% para a plataforma
  const platformFeePercentage = 8
  const platformFeeAmount = (totalAmount * platformFeePercentage) / 100

  // Calcula a percentagem para a empresa
  let companyPercentage = 92
  let affiliatePercentage = 0

  // Se houver afiliado, subtrai o desconto do afiliado da empresa
  if (affiliateWalletId && discountPercentage > 0) {
    companyPercentage = 92 - discountPercentage
    affiliatePercentage = discountPercentage
  }

  // Calcula os valores
  const companyAmount = (totalAmount * companyPercentage) / 100
  const affiliateAmount = (totalAmount * affiliatePercentage) / 100

  // Monta os splits
  const splits: Array<{ walletId: string; percentageValue: number }> = []

  // Sempre adiciona a empresa
  splits.push({
    walletId: companyWalletId,
    percentageValue: companyPercentage
  })

  // Se houver afiliado, adiciona
  if (affiliateWalletId && affiliatePercentage > 0) {
    splits.push({
      walletId: affiliateWalletId,
      percentageValue: affiliatePercentage
    })
  }

  console.log('💰 Splits calculados:', {
    platformFee: `${platformFeePercentage}% = R$ ${platformFeeAmount.toFixed(2)}`,
    company: `${companyPercentage}% = R$ ${companyAmount.toFixed(2)}`,
    affiliate: `${affiliatePercentage}% = R$ ${affiliateAmount.toFixed(2)}`,
    total: `R$ ${(platformFeeAmount + companyAmount + affiliateAmount).toFixed(2)}`
  })

  return {
    platformFeePercentage,
    platformFeeAmount,
    companyPercentage,
    companyAmount,
    affiliatePercentage,
    affiliateAmount,
    splits
  }
}

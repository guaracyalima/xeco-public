/**
 * Utilitário para gerar assinatura HMAC-SHA256
 * Usado para fraud prevention no checkout
 */

import crypto from 'crypto'

const HMAC_SECRET = process.env.CHECKOUT_SIGNATURE_SECRET || 'xeco-secret-key-change-in-production'

console.log('🔐🔐🔐 CHECKOUT-SIGNATURE.TS CARREGADO!')
console.log('🔐 HMAC_SECRET:', HMAC_SECRET)
console.log('🔐 process.env.CHECKOUT_SIGNATURE_SECRET:', process.env.CHECKOUT_SIGNATURE_SECRET)
console.log('🔐 Secret length:', HMAC_SECRET.length)

/**
 * Gera uma assinatura HMAC-SHA256 para os dados do checkout
 * Previne adulteração de dados no frontend
 */
export function generateCheckoutSignature(data: {
  companyId: string
  totalAmount: number
  items: Array<{
    productId?: string  // ⚠️ Opcional - NÃO usado na assinatura
    quantity: number
    unitPrice: number
  }>
  couponCode?: string
}): string {
  console.log('🔐 generateCheckoutSignature - SECRET SENDO USADO:', HMAC_SECRET)
  
  // ⚠️ CRÍTICO: Estrutura DEVE ser IDÊNTICA ao N8N
  // N8N NÃO inclui productId na validação!
  const dataString = JSON.stringify({
    companyId: data.companyId,
    totalAmount: data.totalAmount,
    items: data.items.map(item => ({
      // ⚠️ NÃO incluir productId - N8N não valida isso!
      quantity: item.quantity,
      unitPrice: item.unitPrice
    }))
  })

  console.log('🔐 Data string:', dataString)
  
  const signature = crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(dataString)
    .digest('hex')
  
  console.log('🔐 Signature gerada:', signature)
  
  return signature
}

/**
 * Valida uma assinatura HMAC-SHA256
 * Usada no n8n para detectar fraude
 */
export function validateCheckoutSignature(
  data: any,
  signature: string
): boolean {
  const expectedSignature = generateCheckoutSignature(data)
  
  console.log('🔐 validateCheckoutSignature:')
  console.log('  📥 Dados recebidos:', JSON.stringify(data, null, 2))
  console.log('  🔑 Assinatura esperada:', expectedSignature)
  console.log('  🔑 Assinatura recebida: ', signature)
  console.log('  ✅ Match:', expectedSignature === signature)
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

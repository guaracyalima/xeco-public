/**
 * Configurações para integração com n8n workflows
 */

// Usa a API route local do Next.js que faz proxy para o n8n
// Isso evita problemas de CORS fazendo a requisição do servidor
const N8N_API_ROUTE = '/api/checkout/create-payment'
const N8N_ASAAS_ACCOUNT_ROUTE = '/api/affiliate/create-asaas-account'

// Endpoints do n8n
export const N8N_ENDPOINTS = {
  createPayment: N8N_API_ROUTE,
  createAsaasAccount: N8N_ASAAS_ACCOUNT_ROUTE,
} as const

// Tipos para requisição de pagamento
export interface N8NPaymentRequest {
  billingTypes: string[]
  chargeTypes: string[]
  minutesToExpire: number
  totalAmount: number
  externalReference: string
  callback: {
    successUrl: string
    cancelUrl: string
    expiredUrl: string
  }
  items: Array<{
    externalReference: string
    productId: string
    description: string
    imageUrl?: string // ← Frontend envia URL
    imageBase64?: string // ← Backend adiciona base64
    name: string
    quantity: number
    value: number
    unitPrice: number
  }>
  customerData: {
    name: string
    cpfCnpj: string
    email: string
    phone: string
    address: string
    addressNumber: string
    complement: string
    province: string
    postalCode: string
    city: string
  }
  installment: {
    maxInstallmentCount: number
  }
  splits: Array<{
    walletId: string
    percentageValue: number
  }>
  // Dados internos para auditoria e double-check
  orderId: string // ID da ordem criada no Firebase
  companyId: string
  companyOrder: string
  userId: string
  productList: Array<{
    productId: string
    productName: string
    quantity: number
    unitPrice: number
    totalPrice: number // quantity × unitPrice
  }>
  signature?: string // ← NOVO: Assinatura HMAC para fraud prevention
}

// Tipos para resposta de sucesso
export interface N8NPaymentSuccessResponse {
  id: string
  link: string
  status: string
  minutesToExpire: number
  externalReference: string
  billingTypes: string[]
  chargeTypes: string[]
  callback: {
    cancelUrl: string
    successUrl: string
    expiredUrl: string
  }
  items: Array<{
    name: string
    description: string
    externalReference: string
    quantity: number
    value: number
  }>
  subscription: null
  installment: {
    maxInstallmentCount: number
  }
  split: Array<{
    walletId: string
    fixedValue: null | number
    percentageValue: number
    totalFixedValue: null | number
  }>
  customer: null
  customerData: {
    email: string
    name: string
    cpfCnpj: string
    phoneNumber: string
    address: string
    addressNumber: string
    complement: string
    postalCode: string
    province: string
    cityId: number
    cityName: string
  }
}

// Tipos para resposta de erro
export interface N8NPaymentErrorResponse {
  errors: Array<{
    code: string
    description: string
  }>
}

// Type guard para verificar se é resposta de erro
export function isErrorResponse(response: unknown): response is N8NPaymentErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'errors' in response &&
    Array.isArray((response as N8NPaymentErrorResponse).errors)
  )
}

// Type guard para verificar se é resposta de sucesso
export function isSuccessResponse(response: unknown): response is N8NPaymentSuccessResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    (response as any).success === true &&
    ('checkoutUrl' in response || 'link' in response) &&
    ('asaasPaymentId' in response || 'id' in response)
  )
}

// ============================================================================
// ASAAS ACCOUNT CREATION
// ============================================================================

export interface N8NAsaasAccountRequest {
  affiliateId: string // ID do afiliado já criado no Firestore
  name: string
  email: string
  cpfCnpj: string
  birthDate?: string // Obrigatório para CPF
  companyType?: 'MEI' | 'LIMITED' | 'INDIVIDUAL' | 'ASSOCIATION' // Obrigatório para CNPJ
  phone?: string
  mobilePhone: string
  site?: string
  incomeValue?: number
  address: string
  addressNumber: string
  complement?: string
  province: string
  postalCode: string
}

export interface N8NAsaasAccountSuccessResponse {
  success: true
  walletId: string
  accountId: string
  message: string
}

export interface N8NAsaasAccountErrorResponse {
  success: false
  error: string
  details?: any
}

export type N8NAsaasAccountResponse = N8NAsaasAccountSuccessResponse | N8NAsaasAccountErrorResponse


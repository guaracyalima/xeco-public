/**
 * Configurações para integração com n8n workflows
 * 
 * IMPORTANTE: SEMPRE usar API Route para evitar CORS
 * O Capacitor WebView carrega de https://xuxum.com.br (Railway)
 * As API Routes rodam no servidor Railway e fazem proxy para n8n
 */

// SEMPRE usa API Route - funciona tanto em web quanto em mobile Capacitor
const getCreatePaymentEndpoint = () => {
  console.log('🌐 [N8N_CONFIG] Usando API Route: /api/checkout/create-payment')
  return '/api/checkout/create-payment'
}

const getAsaasAccountEndpoint = () => {
  return '/api/affiliate/create-asaas-account'
}

// Endpoints do n8n
export const N8N_ENDPOINTS = {
  get createPayment() {
    return getCreatePaymentEndpoint()
  },
  get createAsaasAccount() {
    return getAsaasAccountEndpoint()
  },
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
    imageUrl?: string
    imageBase64?: string
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
  orderId: string
  companyId: string
  companyOrder: string
  userId: string
  productList: Array<{
    productId: string
    productName: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
  couponCode?: string
  signature?: string
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
  affiliateId: string
  name: string
  email: string
  cpfCnpj: string
  birthDate?: string
  companyType?: 'MEI' | 'LIMITED' | 'INDIVIDUAL' | 'ASSOCIATION'
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

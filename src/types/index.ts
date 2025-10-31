export interface User {
  id: string
  name: string
  email: string
  requiresPasswordChange?: boolean
  createdAt: Date
  updatedAt: Date
}

export interface UserProfile {
  uid: string
  display_name: string
  email: string
  phone_number: string
  photo_url?: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
  cep: string
  document_number: string
  location?: string
  created_time: string
  completed_profile: 'SIM' | 'NAO'
  enabled: boolean
  entrepreneur: 'SIM' | 'NAO'
  affiliated: 'SIM' | 'NAO'
  haveanaccount: 'SIM' | 'NAO'
  customer_id?: string
  role: string[]
}

export interface FirebaseError {
  code: string
  message: string
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  success: boolean
}

// Business entities
export interface Company {
  id: string
  name: string
  about: string
  logo?: string
  phone: string
  whatsapp: string
  city: string
  state: string
  categoryId: string
  categoryName?: string // Nome da categoria (para exibição)
  status: boolean  // Campo correto: status ao invés de isActive
  createdAt: Date
  updatedAt: Date
}

export interface CompanyCategory {
  id: string
  name: string
  icon: string
  color: string
  createdAt: Date
  updatedAt: Date
}

export interface CompanyUrl {
  id: string
  companyId: string
  slug: string
  city: string
  state: string
  fullUrl: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Product {
  id: string
  name: string
  description?: string  // Descrição do produto
  companyOwner: string // ID da empresa
  companyOwnerName?: string // Nome da empresa (para exibição)
  imagesUrl: string[]
  salePrice: number
  stockQuantity: number
  cidade: string  // Campo correto: cidade
  uf: string
  productEmphasis: boolean
  active: string  // Campo correto: "SIM" ou "NÃO"
  produtoOuServico?: 'PRODUTO' | 'SERVICO' // Tipo: Produto ou Serviço
  tipo_produto?: 'Fisico' | 'Digital' // Tipo físico ou digital
  createdAt: Date
  updatedAt: Date
}

// Affiliate types
export interface AffiliateInvitation {
  id: string
  email: string
  emailSentId: string
  expiresAt: string // ISO string date
  inviteToken: string
  inviteUrl: string
  message: string
  recipientName: string
  resentCount: number
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED'
  storeId: string
  storeName: string
  storeOwnerName: string
  commissionRate: number // Taxa de comissão do afiliado (ex: 5 para 5%)
  createdAt?: Date
}

export interface Affiliated {
  id: string
  user: string // user ID
  walletId: string
  walletSource?: 'company' | 'personal' // Origem da wallet: empresa própria ou pessoal
  ownCompanyId?: string // ID da empresa do afiliado (se for dono de franquia)
  invite_code: string // unique affiliate code
  active: 'SIM' | 'NAO'
  company_relationed: string // store ID
  email: string
  whatsapp: string
  name: string
  commissionRate: number // Taxa de comissão do afiliado (ex: 5 para 5%)
  createdAt: Date
  updatedAt: Date
  // Dados da conta Asaas (quando configurada)
  asaasEnabled?: boolean
  asaasAccountStatus?: string
  asaasAccountId?: string
  asaasApiKey?: string
  asaasAccountNumber?: {
    agency: number // Vem como NUMBER do Firestore
    account: number // Vem como NUMBER do Firestore
    accountDigit: number // Vem como NUMBER do Firestore
  }
}

export interface AffiliateSale {
  id?: string
  affiliateId: string
  storeId: string
  orderId: string
  customerEmail: string
  orderValue: number
  commissionValue: number
  commissionRate: number
  couponUsed?: string
  clickId?: string
  saleDate: Date
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED'
  createdAt: Date
}

export interface AffiliateConfirmRequest {
  inviteToken: string
  email: string
  walletId?: string // Opcional: quando já criou a conta Asaas
  cpfCnpj?: string // Opcional: CPF/CNPJ do usuário (quando preenche no form)
}

export interface AffiliateConfirmResponse {
  success: boolean
  message: string
  data?: {
    affiliateId: string
    storeName: string
    inviteCode: string
    isNewUser: boolean
    requiresPasswordChange: boolean
    // Quando precisa criar conta Asaas:
    cpfCnpj?: string
    email?: string
  }
}

// Coupon types
export interface Coupon {
  id: string
  code: string
  type: 'COMPANY' | 'AFFILIATE'
  companyId: string
  affiliateId?: string // Only for AFFILIATE type
  discountType: 'percentage' | 'fixed' // lowercase to match Firestore
  discountValue: number // Can be percentage (10 = 10%) or fixed amount in BRL
  description?: string
  isActive: boolean // Changed from 'active' to match Firestore
  expiresAt?: Date | null
  maxUses?: number | null // Changed from 'usageLimit' to match Firestore
  usedCount?: number // Count of times used
  minOrderValue?: number | null // Changed from 'minimumAmount' to match Firestore
  totalClicks?: number
  totalConversions?: number
  totalRevenue?: number
  emailSent?: boolean
  emailSentAt?: Date | string
  createdAt: Date
  updatedAt: Date
}

export interface CouponValidationResult {
  valid: boolean
  message: string
  coupon?: Coupon
  affiliate?: Affiliated
  discountAmount?: number
}

export interface CartDiscount {
  coupon: Coupon
  affiliate?: Affiliated
  discountAmount: number
  originalTotal: number
  finalTotal: number
}

// Order and OrderItem entities
export interface Order {
  id?: string
  chanel: 'WHATSAPP' | 'WEBSITE'
  company_owner_of_products: string // Reference to company
  created_at: Date
  created_by: string // User ID
  customer: string // User ID
  description?: string
  location: [number, number] // [lat, lng]
  owner: string // Company ID
  owner_of_company: string // Company owner user ID
  product: string // Main product name for reference
  product_reference: string // Reference to main product
  status: 'CREATED' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  totalGeral: number
  type: 'PRODUCT'
}

export interface OrderItem {
  id?: string
  buyer: string // Reference to user
  order_relationed: string // Reference to order
  peso?: number // Weight in grams
  price: number // Unit price
  product: string // Reference to product
  quantity: number
  total: number // price * quantity
}

// Cart types for local state management
export interface CartItem {
  product: Product
  quantity: number
  total: number
}

export interface Cart {
  items: CartItem[]
  companyId: string | null
  companyName: string | null
  totalItems: number
  totalPrice: number
}

// Search and filter types
export interface SearchFilters {
  query?: string
  city?: string
  state?: string
  categoryId?: string
}

export interface SearchResult {
  companies: Company[]
  products: Product[]
  categories: CompanyCategory[]
}
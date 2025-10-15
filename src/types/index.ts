export interface User {
  id: string
  name: string
  email: string
  createdAt: Date
  updatedAt: Date
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
  createdAt: Date
  updatedAt: Date
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
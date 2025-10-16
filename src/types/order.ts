export interface OrderItem {
  id: string
  productId: string
  productName: string
  productReference: string // referência do produto no Firestore
  quantity: number
  unitPrice: number
  totalPrice: number
  productImage?: string
}

export interface Order {
  id: string
  // Dados do cliente
  customerId: string // ID do usuário autenticado
  customerEmail: string
  customerName: string
  customerPhone: string
  customerCpf?: string
  customerAddress?: {
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    zipCode: string
  }
  
  // Dados da empresa (dona dos produtos)
  companyId: string
  companyReference: string // referência da empresa no Firestore
  companyOwnerId: string // ID do dono da empresa
  
  // Dados do pedido
  items: OrderItem[]
  totalAmount: number
  description: string
  
  // Controle e status
  status: 'CREATED' | 'PENDING_PAYMENT' | 'PAID' | 'CANCELLED' | 'EXPIRED'
  channel: 'WEB' | 'MOBILE' | 'WHATSAPP'
  type: 'PRODUCT'
  
  // Dados de pagamento (preenchidos após n8n)
  checkoutId?: string
  checkoutUrl?: string
  paymentStatus?: 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED'
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
  
  // Localização (opcional)
  location?: [number, number] // [latitude, longitude]
}

// Interface para enviar dados para o n8n
export interface CheckoutRequest {
  order: Order
  company: {
    id: string
    name: string
    walletId?: string
    asaasAccountStatus?: string
    enabledShop?: boolean
  }
  products: Array<{
    id: string
    name: string
    price: number
    quantity: number
    imageBase64?: string
  }>
  buyer: {
    id: string
    name: string
    email: string
    phone: string
    cpf?: string
  }
}

// Interface para resposta do n8n
export interface CheckoutResponse {
  checkoutUrl: string
  checkoutId: string
  message: string
  error?: string
}

// Interface para dados adicionais do usuário na finalização
export interface CheckoutUserData {
  cpf: string
  address: {
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    zipCode: string
  }
}
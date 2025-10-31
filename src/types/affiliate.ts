export interface AffiliateInvitation {
  id: string
  inviteToken: string
  email: string
  companyId: string
  companyName?: string
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  createdAt: Date
  expiresAt: Date
  createdBy: string // user ID who created the invitation
}

export interface Affiliated {
  id: string
  user: string // user ID
  walletId: string
  invite_code: string // unique affiliate code
  active: 'SIM' | 'NAO'
  company_relationed: string // company ID
  email: string
  whatsapp: string
  name: string
  photoUrl?: string // Foto do perfil do usuário
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
  // Campos opcionais para wallet source
  walletSource?: 'company' | 'personal'
  ownCompanyId?: string
  commissionRate?: number
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
    companyName: string
    inviteCode: string
    isNewUser: boolean
    temporaryPassword?: string
    // Quando precisa criar conta Asaas:
    cpfCnpj?: string
    email?: string
  }
}
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
  createdAt: Date
  updatedAt: Date
}

export interface AffiliateConfirmRequest {
  inviteToken: string
  email: string
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
  }
}
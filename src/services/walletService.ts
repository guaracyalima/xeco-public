import { 
  collection, 
  getDocs,
  query, 
  where,
  doc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Company } from '@/types'

/**
 * Busca empresa por documento (CPF ou CNPJ)
 */
export async function getCompanyByDocument(documentNumber: string): Promise<Company | null> {
  try {
    console.log('🔍 [WalletService] Buscando empresa por documento:', documentNumber)
    
    const companiesRef = collection(db, 'companies')
    const q = query(companiesRef, where('document', '==', documentNumber))
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      console.log('ℹ️ [WalletService] Nenhuma empresa encontrada com este documento')
      return null
    }
    
    const companyDoc = querySnapshot.docs[0]
    const data = companyDoc.data()
    
    const company: Company = {
      id: companyDoc.id,
      name: data.name,
      about: data.about || '',
      logo: data.logo,
      phone: data.phone || '',
      whatsapp: data.whatsapp || '',
      city: data.city || '',
      state: data.state || '',
      categoryId: data.categoryId || '',
      status: data.status || false,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    }
    
    console.log('✅ [WalletService] Empresa encontrada:', company.name)
    return company
  } catch (error) {
    console.error('❌ [WalletService] Erro ao buscar empresa:', error)
    return null
  }
}

/**
 * Verifica se já existe uma conta Asaas para o documento
 * (Busca em affiliated ou companies)
 */
export async function checkExistingWalletId(documentNumber: string): Promise<string | null> {
  try {
    console.log('🔍 [WalletService] Verificando walletId existente para:', documentNumber)
    
    // 1. Verifica se tem empresa com este documento
    const company = await getCompanyByDocument(documentNumber)
    if (company && (company as any).walletId) {
      console.log('✅ [WalletService] WalletId encontrado na empresa:', (company as any).walletId)
      return (company as any).walletId
    }
    
    // 2. TODO: Buscar em outras collections se necessário
    // (ex: se tiver uma collection de contas pessoais)
    
    console.log('ℹ️ [WalletService] Nenhum walletId encontrado')
    return null
  } catch (error) {
    console.error('❌ [WalletService] Erro ao verificar walletId:', error)
    return null
  }
}

/**
 * Cria uma nova conta Asaas
 * Retorna o walletId gerado
 */
export async function createAsaasAccount(data: {
  name: string
  email: string
  cpfCnpj: string
  phone: string
  mobilePhone?: string
  address?: string
  addressNumber?: string
  province?: string
  postalCode?: string
}): Promise<{ walletId: string; accountId: string }> {
  try {
    console.log('🚀 [WalletService] Criando conta Asaas para:', data.email)
    
    const ASAAS_API_KEY = process.env.NEXT_PUBLIC_ASAAS_API_KEY
    const ASAAS_API_URL = process.env.NEXT_PUBLIC_ASAAS_API_URL || 'https://api-sandbox.asaas.com/v3'
    
    if (!ASAAS_API_KEY) {
      throw new Error('ASAAS_API_KEY não configurada')
    }
    
    // Cria subconta no Asaas
    const response = await fetch(`${ASAAS_API_URL}/accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY
      },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        cpfCnpj: data.cpfCnpj,
        phone: data.phone,
        mobilePhone: data.mobilePhone || data.phone,
        address: data.address,
        addressNumber: data.addressNumber,
        province: data.province,
        postalCode: data.postalCode
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ [WalletService] Erro Asaas:', errorData)
      throw new Error(errorData.errors?.[0]?.description || 'Erro ao criar conta Asaas')
    }
    
    const accountData = await response.json()
    console.log('✅ [WalletService] Conta Asaas criada:', accountData.id)
    
    return {
      walletId: accountData.walletId,
      accountId: accountData.id
    }
  } catch (error) {
    console.error('❌ [WalletService] Erro ao criar conta Asaas:', error)
    throw error
  }
}

/**
 * Determina qual walletId usar para o afiliado
 * Retorna: { walletId, walletSource, ownCompanyId? }
 */
export async function determineAffiliateWallet(
  userId: string,
  documentNumber: string
): Promise<{
  walletId: string
  walletSource: 'company' | 'personal'
  ownCompanyId?: string
  companyName?: string
}> {
  try {
    console.log('🔍 [WalletService] Determinando wallet para afiliado:', userId)
    
    // 1. Verifica se tem empresa com este documento
    const company = await getCompanyByDocument(documentNumber)
    
    if (company && (company as any).walletId) {
      console.log('✅ [WalletService] Usando wallet da empresa:', company.name)
      return {
        walletId: (company as any).walletId,
        walletSource: 'company',
        ownCompanyId: company.id,
        companyName: company.name
      }
    }
    
    // 2. Verifica se já tem conta Asaas pessoal
    const existingWalletId = await checkExistingWalletId(documentNumber)
    
    if (existingWalletId) {
      console.log('✅ [WalletService] Usando wallet pessoal existente')
      return {
        walletId: existingWalletId,
        walletSource: 'personal'
      }
    }
    
    // 3. Precisa criar nova conta
    console.log('⚠️ [WalletService] Necessário criar nova conta Asaas')
    throw new Error('REQUIRES_ASAAS_ACCOUNT_CREATION')
    
  } catch (error) {
    console.error('❌ [WalletService] Erro ao determinar wallet:', error)
    throw error
  }
}

/**
 * Salva dados da conta Asaas criada para o afiliado
 */
export async function saveAffiliateAsaasAccount(
  userId: string,
  accountData: {
    walletId: string
    accountId: string
    cpfCnpj: string
  }
): Promise<void> {
  try {
    console.log('💾 [WalletService] Salvando dados da conta Asaas do afiliado')
    
    const accountRef = doc(db, 'affiliate_asaas_accounts', userId)
    await setDoc(accountRef, {
      ...accountData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    console.log('✅ [WalletService] Dados salvos com sucesso')
  } catch (error) {
    console.error('❌ [WalletService] Erro ao salvar conta:', error)
    throw error
  }
}

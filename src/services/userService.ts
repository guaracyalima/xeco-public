import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { CheckoutUserData } from '@/types/order'

export interface UserProfile {
  id: string
  name?: string
  email?: string
  phone?: string
  cpf?: string
  address?: {
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    zipCode: string
  }
  createdAt: Date
  updatedAt: Date
}

export class UserService {
  /**
   * Busca o perfil completo do usuário
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId))
      
      if (!userDoc.exists()) {
        return null
      }

      const data = userDoc.data()
      return {
        id: userDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as UserProfile
    } catch (error) {
      console.error('❌ Erro ao buscar perfil do usuário:', error)
      return null
    }
  }

  /**
   * Verifica se o usuário tem dados de checkout completos
   */
  static async hasCompleteCheckoutData(userId: string): Promise<boolean> {
    const profile = await this.getUserProfile(userId)
    
    if (!profile) return false

    // Verifica se tem CPF e endereço completo
    const hasCpf = !!profile.cpf
    const hasAddress = !!(
      profile.address?.street &&
      profile.address?.number &&
      profile.address?.neighborhood &&
      profile.address?.city &&
      profile.address?.state &&
      profile.address?.zipCode
    )

    return hasCpf && hasAddress
  }

  /**
   * Salva ou atualiza dados de checkout do usuário
   */
  static async saveCheckoutData(
    userId: string,
    userData: CheckoutUserData,
    userEmail: string,
    userName?: string,
    userPhone?: string
  ): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId)
      const existingUser = await getDoc(userRef)

      const profileData = {
        cpf: userData.cpf,
        address: userData.address,
        updatedAt: new Date()
      }

      if (existingUser.exists()) {
        // Atualiza usuário existente
        await updateDoc(userRef, profileData)
        console.log('✅ Dados de checkout atualizados para usuário existente')
      } else {
        // Cria novo perfil de usuário
        await setDoc(userRef, {
          ...profileData,
          email: userEmail,
          name: userName || '',
          phone: userPhone || '',
          createdAt: new Date()
        })
        console.log('✅ Novo perfil de usuário criado com dados de checkout')
      }
    } catch (error) {
      console.error('❌ Erro ao salvar dados de checkout:', error)
      throw new Error('Erro ao salvar dados do usuário')
    }
  }

  /**
   * Converte dados do perfil para formato CheckoutUserData
   */
  static profileToCheckoutData(profile: UserProfile): CheckoutUserData | null {
    if (!profile.cpf || !profile.address) {
      return null
    }

    return {
      cpf: profile.cpf,
      address: profile.address
    }
  }

  /**
   * Atualiza apenas informações básicas do usuário (nome, telefone, etc)
   */
  static async updateBasicInfo(
    userId: string,
    updates: Partial<Pick<UserProfile, 'name' | 'phone'>>
  ): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date()
      })
      console.log('✅ Informações básicas do usuário atualizadas')
    } catch (error) {
      console.error('❌ Erro ao atualizar informações do usuário:', error)
      throw new Error('Erro ao atualizar dados do usuário')
    }
  }
}
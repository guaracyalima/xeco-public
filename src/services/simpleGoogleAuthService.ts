'use client'

import { signInWithPopup, GoogleAuthProvider, UserCredential } from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'

/**
 * Versão simplificada do serviço de autenticação Google
 * Esta versão força sempre o uso de autenticação web para maior compatibilidade
 */
export class SimpleGoogleAuthService {
  static async signInWithGoogle(): Promise<UserCredential> {
    console.log('🔵 [Simple Google Auth] Iniciando autenticação web...')
    
    try {
      // Sempre usa autenticação web via popup
      const result = await signInWithPopup(auth, googleProvider)
      console.log('✅ [Simple Google Auth] Login bem-sucedido:', result.user.email)
      return result
    } catch (error: any) {
      console.error('❌ [Simple Google Auth] Erro:', error)
      
      // Tratamento específico de erros comuns
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Login cancelado pelo usuário')
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup bloqueado pelo navegador')
      } else if (error.code === 'auth/cancelled-popup-request') {
        throw new Error('Popup cancelado')
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Problema de conexão')
      } else if (error.code === 'auth/invalid-api-key') {
        throw new Error('Configuração de API inválida')
      } else if (error.code === 'auth/unauthorized-domain') {
        throw new Error('Domínio não autorizado')
      }
      
      throw error
    }
  }

  static async signOut(): Promise<void> {
    try {
      await auth.signOut()
      console.log('✅ [Simple Google Auth] Logout bem-sucedido')
    } catch (error) {
      console.error('❌ [Simple Google Auth] Erro no logout:', error)
      throw error
    }
  }
}
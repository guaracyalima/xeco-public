'use client'

import { signInWithPopup, signInWithCredential, GoogleAuthProvider, UserCredential } from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'
import { Capacitor } from '@capacitor/core'

export class GoogleAuthService {
  static async signInWithGoogle(): Promise<UserCredential> {
    const platform = Capacitor.getPlatform()
    console.log('🚀 Google Auth - Platform:', platform)
    
    try {
      if (platform === 'web') {
        // 🌐 WEB: Popup normal funciona perfeitamente
        console.log('🌐 Web: Usando signInWithPopup')
        const result = await signInWithPopup(auth, googleProvider)
        console.log('✅ Web Google Auth sucesso:', result.user.email)
        return result
      } else {
        // 📱 MOBILE: Usar plugin nativo do Firebase
        console.log('📱 Mobile: Usando FirebaseAuthentication nativo')
        
        // Import dinâmico para não quebrar na web
        const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication')
        
        const result = await FirebaseAuthentication.signInWithGoogle()
        console.log('📱 Native result:', result)
        
        if (!result.credential?.idToken) {
          throw new Error('Token não recebido do Google')
        }
        
        // Sincronizar com Firebase Web SDK
        const credential = GoogleAuthProvider.credential(result.credential.idToken)
        const userCredential = await signInWithCredential(auth, credential)
        
        console.log('✅ Mobile Google Auth sucesso:', userCredential.user.email)
        return userCredential
      }
      
    } catch (error: any) {
      console.error('❌ Google Auth Error:', error.code, error.message)
      throw error
    }
  }

  static async signOut(): Promise<void> {
    try {
      await auth.signOut()
      console.log('✅ Logout sucesso')
    } catch (error) {
      console.error('❌ Erro logout:', error)
      throw error
    }
  }

  static async isAvailable(): Promise<boolean> {
    return true
  }
}

export function useGoogleAuth() {
  return {
    signInWithGoogle: GoogleAuthService.signInWithGoogle,
    signOut: GoogleAuthService.signOut,
    isAvailable: GoogleAuthService.isAvailable,
  }
}

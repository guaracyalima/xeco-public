'use client'

import { signInWithPopup, signInWithCredential, GoogleAuthProvider, UserCredential } from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'
import { Capacitor } from '@capacitor/core'

/**
 * Verifica se o plugin FirebaseAuthentication está realmente disponível
 * Isso é importante porque quando o app carrega URL remota, os plugins nativos
 * não estão bridgeados mesmo que Capacitor.isNativePlatform() retorne true
 */
async function isFirebaseAuthPluginAvailable(): Promise<boolean> {
  try {
    // Verifica se estamos em plataforma nativa
    if (!Capacitor.isNativePlatform()) {
      console.log('🌐 Não é plataforma nativa, plugin não disponível')
      return false
    }
    
    // Tenta importar e verificar se o plugin está registrado
    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication')
    
    // Verifica se o plugin tem os métodos esperados e está bridgeado
    if (FirebaseAuthentication && typeof FirebaseAuthentication.signInWithGoogle === 'function') {
      // Tenta uma operação simples para ver se o bridge funciona
      // Se o plugin não estiver bridgeado, vai dar erro
      console.log('📱 Plugin FirebaseAuthentication encontrado')
      return true
    }
    
    return false
  } catch (error) {
    console.log('⚠️ Plugin FirebaseAuthentication não disponível:', error)
    return false
  }
}

export class GoogleAuthService {
  static async signInWithGoogle(): Promise<UserCredential> {
    const platform = Capacitor.getPlatform()
    const isNative = Capacitor.isNativePlatform()
    console.log('🚀 Google Auth - Platform:', platform, 'isNative:', isNative)
    
    try {
      // Verifica se o plugin nativo está realmente disponível
      const pluginAvailable = await isFirebaseAuthPluginAvailable()
      console.log('🔌 Plugin Firebase Auth disponível:', pluginAvailable)
      
      if (pluginAvailable) {
        // 📱 MOBILE NATIVO: Usar plugin nativo do Firebase
        console.log('📱 Mobile: Usando FirebaseAuthentication nativo')
        
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
      } else {
        // 🌐 WEB ou MOBILE sem plugin: Popup normal
        console.log('🌐 Web/Fallback: Usando signInWithPopup')
        const result = await signInWithPopup(auth, googleProvider)
        console.log('✅ Web Google Auth sucesso:', result.user.email)
        return result
      }
      
    } catch (error: any) {
      console.error('❌ Google Auth Error:', error.code, error.message, error)
      
      // Se der erro no plugin nativo, tenta fallback pro web
      if (error.message?.includes('null object reference') || error.message?.includes('not implemented')) {
        console.log('🔄 Tentando fallback para web auth...')
        try {
          const result = await signInWithPopup(auth, googleProvider)
          console.log('✅ Fallback Web Auth sucesso:', result.user.email)
          return result
        } catch (fallbackError: any) {
          console.error('❌ Fallback também falhou:', fallbackError)
          throw fallbackError
        }
      }
      
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
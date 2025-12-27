'use client'

import { signInWithPopup, signInWithCredential, GoogleAuthProvider, UserCredential, signInWithRedirect, getRedirectResult } from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'
import { Capacitor } from '@capacitor/core'

/**
 * Verifica se o plugin FirebaseAuthentication está realmente disponível E funcionando
 */
async function isFirebaseAuthPluginAvailable(): Promise<boolean> {
  try {
    if (!Capacitor.isNativePlatform()) {
      return false
    }
    
    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication')
    
    // Testa se o plugin está realmente bridgeado tentando chamar um método
    if (FirebaseAuthentication && typeof FirebaseAuthentication.signInWithGoogle === 'function') {
      // Verifica se o bridge está funcionando checando se é um plugin real
      // Plugins não bridgeados vão ter métodos que jogam erro de "null object"
      console.log('📱 Plugin FirebaseAuthentication encontrado, testando bridge...')
      
      // Verifica se temos o método getCurrentUser que não requer interação
      if (typeof FirebaseAuthentication.getCurrentUser === 'function') {
        try {
          await FirebaseAuthentication.getCurrentUser()
          console.log('✅ Bridge funcionando!')
          return true
        } catch (e: any) {
          // Se der null object reference, o bridge não está funcionando
          if (e.message?.includes('null object') || e.message?.includes('null pointer')) {
            console.log('❌ Bridge não está funcionando (null object)')
            return false
          }
          // Outros erros podem ser ok (ex: usuário não logado)
          return true
        }
      }
      return true
    }
    
    return false
  } catch (error) {
    console.log('⚠️ Plugin FirebaseAuthentication não disponível:', error)
    return false
  }
}

/**
 * Detecta se estamos em um WebView do Capacitor carregando URL remota
 * Nesse caso, não podemos usar popup nem plugins nativos
 */
function isCapacitorWebViewWithRemoteUrl(): boolean {
  if (typeof window === 'undefined') return false
  
  // Verifica se estamos em Capacitor
  const isNative = Capacitor.isNativePlatform()
  
  // Verifica se a URL é remota (não file://)
  const isRemoteUrl = window.location.protocol === 'https:' || window.location.protocol === 'http:'
  
  // Se estamos em plataforma nativa mas com URL remota, estamos no WebView problemático
  const result = isNative && isRemoteUrl
  console.log('🔍 isCapacitorWebViewWithRemoteUrl:', { isNative, isRemoteUrl, result })
  
  return result
}

export class GoogleAuthService {
  static async signInWithGoogle(): Promise<UserCredential> {
    const platform = Capacitor.getPlatform()
    const isNative = Capacitor.isNativePlatform()
    console.log('🚀 Google Auth - Platform:', platform, 'isNative:', isNative)
    
    try {
      // CASO 1: Plugin nativo disponível e funcionando
      const pluginAvailable = await isFirebaseAuthPluginAvailable()
      console.log('🔌 Plugin Firebase Auth disponível:', pluginAvailable)
      
      if (pluginAvailable) {
        console.log('📱 Mobile: Usando FirebaseAuthentication nativo')
        
        const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication')
        
        const result = await FirebaseAuthentication.signInWithGoogle()
        console.log('📱 Native result:', result)
        
        if (!result.credential?.idToken) {
          throw new Error('Token não recebido do Google')
        }
        
        const credential = GoogleAuthProvider.credential(result.credential.idToken)
        const userCredential = await signInWithCredential(auth, credential)
        
        console.log('✅ Mobile Google Auth sucesso:', userCredential.user.email)
        return userCredential
      }
      
      // CASO 2: WebView do Capacitor com URL remota - usar redirect
      if (isCapacitorWebViewWithRemoteUrl()) {
        console.log('📱 WebView com URL remota: Usando signInWithRedirect')
        
        // Primeiro tenta pegar resultado de redirect anterior
        const redirectResult = await getRedirectResult(auth)
        if (redirectResult) {
          console.log('✅ Redirect result encontrado:', redirectResult.user.email)
          return redirectResult
        }
        
        // Se não tem resultado, inicia o redirect
        await signInWithRedirect(auth, googleProvider)
        
        // Isso não deve chegar aqui porque vai redirecionar
        throw new Error('Redirecionando para login...')
      }
      
      // CASO 3: Web normal - popup funciona
      console.log('🌐 Web: Usando signInWithPopup')
      const result = await signInWithPopup(auth, googleProvider)
      console.log('✅ Web Google Auth sucesso:', result.user.email)
      return result
      
    } catch (error: any) {
      console.error('❌ Google Auth Error:', error.code, error.message, error)
      throw error
    }
  }

  /**
   * Deve ser chamado no início do app para capturar resultado de redirect
   */
  static async handleRedirectResult(): Promise<UserCredential | null> {
    try {
      const result = await getRedirectResult(auth)
      if (result) {
        console.log('✅ Redirect login sucesso:', result.user.email)
        return result
      }
      return null
    } catch (error) {
      console.error('❌ Erro ao processar redirect:', error)
      return null
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
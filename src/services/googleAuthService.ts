'use client'

import { signInWithPopup, signInWithCredential, GoogleAuthProvider, UserCredential, signInWithRedirect, getRedirectResult } from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'
import { Capacitor } from '@capacitor/core'

/**
 * Detecta se estamos em um WebView do Capacitor carregando URL remota
 * Nesse caso, NÃO podemos usar popup NEM plugins nativos - só redirect funciona
 */
function isRemoteWebView(): boolean {
  if (typeof window === 'undefined') return false
  
  // Se a URL é https ou http, estamos carregando de servidor remoto
  // Plugins nativos do Capacitor NÃO funcionam nesse cenário
  const isRemote = window.location.protocol === 'https:' || window.location.protocol === 'http:'
  
  console.log('🔍 isRemoteWebView:', { 
    protocol: window.location.protocol, 
    isRemote,
    href: window.location.href 
  })
  
  return isRemote
}

export class GoogleAuthService {
  static async signInWithGoogle(): Promise<UserCredential> {
    const platform = Capacitor.getPlatform()
    console.log('🚀 Google Auth - Platform:', platform)
    
    try {
      // Se estamos carregando de URL remota (https), plugins nativos NÃO funcionam
      // Usar signInWithRedirect que funciona em qualquer browser/webview
      if (isRemoteWebView()) {
        console.log('🌐 URL Remota detectada: Usando signInWithRedirect')
        
        // Primeiro tenta pegar resultado de redirect anterior
        const redirectResult = await getRedirectResult(auth)
        if (redirectResult) {
          console.log('✅ Redirect result encontrado:', redirectResult.user.email)
          return redirectResult
        }
        
        // Se não tem resultado, inicia o redirect
        console.log('🔄 Iniciando redirect para Google...')
        await signInWithRedirect(auth, googleProvider)
        
        // Isso não vai executar porque vai redirecionar
        throw new Error('Redirecionando...')
      }
      
      // Se estamos em file:// (assets locais), podemos tentar plugin nativo
      if (Capacitor.isNativePlatform()) {
        console.log('📱 Assets locais: Tentando plugin nativo')
        
        try {
          const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication')
          const result = await FirebaseAuthentication.signInWithGoogle()
          
          if (!result.credential?.idToken) {
            throw new Error('Token não recebido do Google')
          }
          
          const credential = GoogleAuthProvider.credential(result.credential.idToken)
          const userCredential = await signInWithCredential(auth, credential)
          
          console.log('✅ Native Google Auth sucesso:', userCredential.user.email)
          return userCredential
        } catch (nativeError: any) {
          console.error('❌ Plugin nativo falhou:', nativeError)
          // Fallback para redirect
          await signInWithRedirect(auth, googleProvider)
          throw new Error('Redirecionando...')
        }
      }
      
      // Web normal - popup funciona
      console.log('🌐 Web: Usando signInWithPopup')
      const result = await signInWithPopup(auth, googleProvider)
      console.log('✅ Web Google Auth sucesso:', result.user.email)
      return result
      
    } catch (error: any) {
      console.error('❌ Google Auth Error:', error.code, error.message, error)
      throw error
    }
  }

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
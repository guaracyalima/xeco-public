import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'

export class GoogleAuthService {
  static async signInWithGoogle() {
    console.log('� Google Auth - Abrindo browser (igual ao pagamento)')
    
    const platform = Capacitor.getPlatform()
    console.log('� Platform:', platform)
    
    try {
      // 🔥 SIMPLES: Só abrir Google Auth no browser (igual pagamento)
      const clientId = "300882600959-your-web-client-id.apps.googleusercontent.com" // Client ID web do Google Console
      const authUrl = `https://accounts.google.com/oauth/authorize?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(window.location.origin + '/auth/google/callback')}&` +
        `response_type=code&` +
        `scope=openid%20email%20profile&` +
        `access_type=offline`
      
      console.log('🌐 Abrindo Google Auth URL:', authUrl)
      
      if (platform === 'ios' || platform === 'android') {
        // Mobile: Abrir no browser externo
        await Browser.open({ 
          url: authUrl,
          windowName: '_blank'
        })
      } else {
        // Web: Abrir numa nova aba
        window.open(authUrl, '_blank')
      }
      
      return { 
        success: true, 
        message: 'Google Auth aberto no browser',
        method: 'browser-redirect' 
      }
      
    } catch (error) {
      console.error('❌ Falha ao abrir Google Auth no browser:', error)
      throw error
    }
  }

  static async signOut(): Promise<void> {
    console.log('✅ Logout sucesso')
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
    isNative: Capacitor.getPlatform() === 'ios' || Capacitor.getPlatform() === 'android',
  }
}
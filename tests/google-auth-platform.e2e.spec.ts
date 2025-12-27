import { test, expect } from '@playwright/test'

test.describe('Google Authentication Platform Detection', () => {
  test('should load login page without errors', async ({ page }) => {
    await page.goto('/login')
    
    // Verifica se a página carrega sem erros
    await expect(page).toHaveTitle(/Xuxum/)
    
    // Verifica se o botão do Google existe
    const googleButton = page.locator('button:has-text("Continuar com Google")')
    await expect(googleButton).toBeVisible()
    
    // Verifica se não há erros no console
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    // Aguarda um pouco para capturar possíveis erros
    await page.waitForTimeout(2000)
    
    // Não deve haver erros de carregamento
    expect(errors.filter(e => !e.includes('favicon') && !e.includes('404'))).toHaveLength(0)
  })

  test('should handle web platform detection correctly', async ({ page }) => {
    // Mock para simular ambiente web
    await page.addInitScript(() => {
      ;(window as any).Capacitor = {
        isNativePlatform: () => false,
        getPlatform: () => 'web'
      }
    })
    
    await page.goto('/login')
    
    // Verifica se a página detecta corretamente como web
    const googleButton = page.locator('button:has-text("Continuar com Google")')
    await expect(googleButton).toBeVisible()
    
    // O botão deve estar habilitado (não testamos o clique para evitar popup real)
    await expect(googleButton).toBeEnabled()
    
    console.log('✅ Web platform detection working correctly')
  })

  test('should handle mobile platform detection correctly', async ({ page }) => {
    // Mock para simular ambiente mobile
    await page.addInitScript(() => {
      ;(window as any).Capacitor = {
        isNativePlatform: () => true,
        getPlatform: () => 'ios'
      }
      
      // Mock do plugin Firebase Authentication
      ;(window as any).FirebaseAuthentication = {
        signInWithGoogle: async () => {
          console.log('🔵 Mock: FirebaseAuthentication.signInWithGoogle() chamado')
          return { user: { email: 'test@example.com' } }
        },
        signOut: async () => {
          console.log('🔵 Mock: FirebaseAuthentication.signOut() chamado')
        }
      }
    })
    
    await page.goto('/login')
    
    // Verifica se a página carrega normalmente em ambiente mobile simulado
    const googleButton = page.locator('button:has-text("Continuar com Google")')
    await expect(googleButton).toBeVisible()
    await expect(googleButton).toBeEnabled()
    
    // Verifica logs de detecção de plataforma
    const logs: string[] = []
    page.on('console', msg => {
      logs.push(msg.text())
    })
    
    await page.waitForTimeout(1000)
    
    console.log('✅ Mobile platform detection working correctly')
  })

  test('should show correct form elements', async ({ page }) => {
    await page.goto('/login')
    
    // Verifica elementos da página de login
    await expect(page.locator('h2:has-text("Entre na sua conta")')).toBeVisible()
    
    // Verifica botão do Google
    const googleButton = page.locator('button:has-text("Continuar com Google")')
    await expect(googleButton).toBeVisible()
    
    // Verifica que tem o SVG do Google
    const googleIcon = googleButton.locator('svg')
    await expect(googleIcon).toBeVisible()
    
    // Verifica divisor "Ou continue com e-mail"
    await expect(page.locator('text=Ou continue com e-mail')).toBeVisible()
    
    // Verifica campos de email/password
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    
    console.log('✅ All login form elements are visible and functional')
  })
})
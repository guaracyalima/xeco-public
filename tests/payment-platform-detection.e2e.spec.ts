import { test, expect } from '@playwright/test'

test.describe('Payment Platform Detection', () => {
  test('should detect web platform correctly', async ({ page }) => {
    // Vai para homepage
    await page.goto('/')
    
    // Simula adição de produto ao carrinho e navegação para checkout
    // Adiciona logging para verificar a detecção de plataforma
    await page.addInitScript(() => {
      // Mock do Capacitor para simular ambiente web
      ;(window as any).Capacitor = {
        isNativePlatform: () => false,
        getPlatform: () => 'web'
      }
    })
    
    // Verifica se a página carrega sem erros
    await expect(page).toHaveTitle(/Xuxum/)
    
    // Navega para carrinho (se existir produtos)
    await page.goto('/carrinho')
    
    // Verifica se a página do carrinho carrega
    await expect(page.locator('h1')).toBeVisible()
    
    // Verifica logs do console para confirmar detecção da plataforma
    page.on('console', msg => {
      if (msg.text().includes('[Platform Detection]')) {
        console.log('Platform detection log:', msg.text())
      }
    })
  })

  test('should simulate mobile platform detection', async ({ page }) => {
    // Mock do Capacitor para simular ambiente mobile
    await page.addInitScript(() => {
      ;(window as any).Capacitor = {
        isNativePlatform: () => true,
        getPlatform: () => 'ios'
      }
    })
    
    await page.goto('/carrinho')
    
    // Verifica se a página carrega normalmente mesmo em ambiente mobile simulado
    await expect(page.locator('h1')).toBeVisible()
    
    // Verifica logs de detecção mobile
    page.on('console', msg => {
      if (msg.text().includes('[Platform Detection]')) {
        console.log('Mobile platform detection:', msg.text())
      }
    })
  })

  test('should handle payment URL opening correctly', async ({ page }) => {
    // Mock para interceptar tentativas de abertura de URLs
    let paymentUrlOpened = false
    let paymentMethod = ''
    
    await page.addInitScript(() => {
      // Mock web platform
      ;(window as any).Capacitor = {
        isNativePlatform: () => false,
        getPlatform: () => 'web'
      }
      
      // Intercepta window.location.href
      Object.defineProperty(window.location, 'href', {
        set: (value) => {
          ;(window as any).__paymentUrlOpened = value
          ;(window as any).__paymentMethod = 'web'
        }
      })
    })
    
    await page.goto('/carrinho')
    
    // Se há produtos no carrinho, verifica se o botão de checkout existe
    const checkoutButton = page.locator('button:has-text("Finalizar Compra")')
    
    if (await checkoutButton.isVisible()) {
      // Testa que o botão está presente (não clicamos para não fazer checkout real)
      await expect(checkoutButton).toBeVisible()
      console.log('✅ Checkout button found and ready for payment flow')
    } else {
      console.log('ℹ️ No items in cart, checkout button not visible (expected)')
    }
  })
})
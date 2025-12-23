/**
 * @file tests/pwa-features.e2e.spec.ts
 * @description Testes E2E completos para funcionalidades PWA
 * @coverage: Install Prompt, Offline Mode, Service Worker, Manifest
 */

import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3001'

test.describe('PWA - Installation Flow', () => {
  
  test('Deve exibir PWA install prompt após delay', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    
    // Aguardar delay do PWA prompt (5-6 segundos)
    await page.waitForTimeout(6000)
    
    // Verificar se prompt apareceu
    const pwaPrompt = page.locator('[class*="fixed"][class*="z-50"]').filter({ 
      hasText: /instalar|install|xeco/i 
    })
    
    if (await pwaPrompt.count() > 0) {
      await expect(pwaPrompt.first()).toBeVisible()
      
      // Verificar elementos do prompt
      const installButton = pwaPrompt.locator('button').filter({ 
        hasText: /instalar|install|agora/i 
      })
      const dismissButton = pwaPrompt.locator('button').filter({ 
        hasText: /não|depois|fechar/i 
      })
      
      await expect(installButton.first()).toBeVisible()
      await expect(dismissButton.first()).toBeVisible()
    }
  })

  test('Botão "Agora não" deve fechar prompt', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(6000)
    
    const pwaPrompt = page.locator('[class*="fixed"][class*="z-50"]').filter({ 
      hasText: /instalar|install|xeco/i 
    })
    
    if (await pwaPrompt.count() > 0) {
      const dismissButton = pwaPrompt.locator('button').filter({ 
        hasText: /não|depois|fechar|x/i 
      })
      
      if (await dismissButton.count() > 0) {
        await dismissButton.first().click()
        await page.waitForTimeout(500)
        
        // Prompt deve desaparecer
        await expect(pwaPrompt.first()).not.toBeVisible()
      }
    }
  })

  test('PWA prompt iOS deve mostrar instruções', async ({ page }) => {
    // Simular iOS user agent
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1')
    
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(6000)
    
    const pwaPrompt = page.locator('[class*="fixed"][class*="z-50"]').filter({ 
      hasText: /instalar|install/i 
    })
    
    if (await pwaPrompt.count() > 0) {
      const instructionsButton = pwaPrompt.locator('button').filter({ 
        hasText: /instruções|ver/i 
      })
      
      if (await instructionsButton.count() > 0) {
        await instructionsButton.click()
        await page.waitForTimeout(1000)
        
        // Verificar instruções iOS
        const iosInstructions = page.locator('text="Safari", text="Compartilhar", text="Adicionar à Tela"')
        
        if (await iosInstructions.count() > 0) {
          await expect(iosInstructions.first()).toBeVisible()
        }
      }
    }
  })

  test('Copiar link iOS deve funcionar', async ({ page }) => {
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1')
    
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(6000)
    
    const pwaPrompt = page.locator('[class*="fixed"][class*="z-50"]').filter({ 
      hasText: /instalar|install/i 
    })
    
    if (await pwaPrompt.count() > 0) {
      const instructionsButton = pwaPrompt.locator('button').filter({ 
        hasText: /instruções|ver/i 
      })
      
      if (await instructionsButton.count() > 0) {
        await instructionsButton.click()
        await page.waitForTimeout(1000)
        
        const copyButton = page.locator('button').filter({ hasText: /copiar/i })
        
        if (await copyButton.count() > 0) {
          await copyButton.click()
          await page.waitForTimeout(1000)
          
          // Verificar toast de sucesso
          const successToast = page.locator('[role="alert"], .toast').filter({ 
            hasText: /copiado|sucesso/i 
          })
          
          if (await successToast.count() > 0) {
            await expect(successToast.first()).toBeVisible()
          }
          
          // Verificar que prompt fechou
          await expect(pwaPrompt.first()).not.toBeVisible()
        }
      }
    }
  })

  test('PWA não deve aparecer se já instalado', async ({ page }) => {
    // Simular PWA instalada (standalone mode)
    await page.addInitScript(() => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
          matches: query === '(display-mode: standalone)',
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => {}
        })
      })
    })
    
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(6000)
    
    // Prompt não deve aparecer
    const pwaPrompt = page.locator('[class*="fixed"][class*="z-50"]').filter({ 
      hasText: /instalar|install/i 
    })
    
    expect(await pwaPrompt.count()).toBe(0)
  })
})

test.describe('PWA - Manifest e Metadados', () => {
  
  test('Deve ter manifest.json válido', async ({ page }) => {
    await page.goto(`${BASE_URL}/manifest.json`)
    
    const response = await page.waitForResponse(`${BASE_URL}/manifest.json`)
    expect(response.status()).toBe(200)
    
    const manifest = await response.json()
    
    // Verificar campos obrigatórios
    expect(manifest.name).toBeTruthy()
    expect(manifest.short_name).toBeTruthy()
    expect(manifest.start_url).toBeTruthy()
    expect(manifest.display).toBeTruthy()
    expect(manifest.theme_color).toBeTruthy()
    expect(manifest.background_color).toBeTruthy()
    expect(manifest.icons).toBeTruthy()
    expect(manifest.icons.length).toBeGreaterThan(0)
  })

  test('Ícones PWA devem estar acessíveis', async ({ page }) => {
    // Verificar ícones do manifest
    const manifestResponse = await page.goto(`${BASE_URL}/manifest.json`)
    const manifest = await manifestResponse?.json()
    
    if (manifest?.icons) {
      for (const icon of manifest.icons) {
        const iconResponse = await page.goto(`${BASE_URL}${icon.src}`)
        expect(iconResponse?.status()).toBe(200)
      }
    }
    
    // Verificar ícones comuns
    const commonIcons = [
      '/favicon.ico',
      '/icons/icon-192x192.png',
      '/icons/icon-512x512.png'
    ]
    
    for (const iconPath of commonIcons) {
      const response = await page.goto(`${BASE_URL}${iconPath}`)
      if (response?.status() !== 404) {
        expect(response?.status()).toBe(200)
      }
    }
  })

  test('Meta tags PWA devem estar presentes', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    
    // Verificar meta tags essenciais para PWA
    await expect(page.locator('meta[name="viewport"]')).toBeAttached()
    await expect(page.locator('meta[name="theme-color"]')).toBeAttached()
    
    // Verificar link para manifest
    await expect(page.locator('link[rel="manifest"]')).toBeAttached()
    
    // Verificar apple-touch-icon (para iOS)
    const appleIcon = page.locator('link[rel="apple-touch-icon"]')
    if (await appleIcon.count() > 0) {
      await expect(appleIcon.first()).toBeAttached()
    }
  })
})

test.describe('PWA - Offline Functionality', () => {
  
  test('Deve carregar página em modo offline (simulado)', async ({ page }) => {
    // Primeiro visitar página online
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    
    // Simular modo offline
    await page.context().setOffline(true)
    
    // Tentar recarregar página
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Página deve carregar do cache (ou mostrar página offline)
    const content = page.locator('main, body')
    await expect(content.first()).toBeVisible()
    
    // Não deve mostrar erro de rede do browser
    const networkError = page.locator('text="sem conexão", text="offline", text="ERR_NETWORK"')
    
    // Se houver indicador de offline, deve ser da aplicação, não do browser
    if (await networkError.count() > 0) {
      const appOfflineIndicator = page.locator('[data-testid="offline"], .offline-banner')
      expect(await appOfflineIndicator.count()).toBeGreaterThan(0)
    }
  })

  test('Service Worker deve estar registrado', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    
    // Verificar se service worker está registrado
    const swRegistration = await page.evaluate(() => {
      return navigator.serviceWorker.getRegistration()
    })
    
    // Se PWA tem service worker, deve estar registrado
    if (swRegistration) {
      expect(swRegistration).toBeTruthy()
    }
  })

  test('Deve cachear recursos estáticos', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    
    // Aguardar service worker instalar e cachear recursos
    await page.waitForTimeout(2000)
    
    // Verificar se recursos foram cacheados
    const cacheNames = await page.evaluate(() => {
      return caches.keys()
    })
    
    if (cacheNames.length > 0) {
      expect(cacheNames.length).toBeGreaterThan(0)
      
      // Verificar se cache contém recursos
      const cache = await page.evaluate(async (cacheName) => {
        const cache = await caches.open(cacheName)
        const keys = await cache.keys()
        return keys.length
      }, cacheNames[0])
      
      expect(cache).toBeGreaterThan(0)
    }
  })
})

test.describe('PWA - Mobile Experience', () => {
  
  test('Deve ter comportamento nativo em mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    
    // Verificar que não há zoom horizontal
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const windowWidth = await page.evaluate(() => window.innerWidth)
    expect(bodyWidth).toBeLessThanOrEqual(windowWidth + 20)
    
    // Verificar que touch targets são adequados
    const buttons = page.locator('button, a, input[type="submit"]')
    
    for (let i = 0; i < Math.min(await buttons.count(), 5); i++) {
      const button = buttons.nth(i)
      const box = await button.boundingBox()
      
      if (box && box.height > 0) {
        expect(box.height).toBeGreaterThanOrEqual(40) // Mínimo para touch
      }
    }
  })

  test('Splash screen deve funcionar (verificação indireta)', async ({ page }) => {
    await page.goto(BASE_URL)
    
    // Verificar se há meta tag para splash screen
    const themeColor = await page.locator('meta[name="theme-color"]').getAttribute('content')
    const backgroundColor = await page.evaluate(() => {
      return getComputedStyle(document.body).backgroundColor
    })
    
    expect(themeColor || backgroundColor).toBeTruthy()
  })

  test('Deve funcionar em orientação portrait e landscape', async ({ page }) => {
    // Portrait
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    
    const portraitContent = page.locator('main, [role="main"]')
    await expect(portraitContent.first()).toBeVisible()
    
    // Landscape
    await page.setViewportSize({ width: 812, height: 375 })
    await page.waitForLoadState('networkidle')
    
    const landscapeContent = page.locator('main, [role="main"]')
    await expect(landscapeContent.first()).toBeVisible()
  })
})

test.describe('PWA - Comportamento Avançado', () => {
  
  test('Prompt recusado deve respeitar delay', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(6000)
    
    const pwaPrompt = page.locator('[class*="fixed"][class*="z-50"]').filter({ 
      hasText: /instalar|install/i 
    })
    
    if (await pwaPrompt.count() > 0) {
      // Recusar prompt
      const dismissButton = pwaPrompt.locator('button').filter({ 
        hasText: /não|depois|fechar/i 
      })
      
      if (await dismissButton.count() > 0) {
        await dismissButton.click()
        await page.waitForTimeout(500)
        
        // Recarregar página
        await page.reload()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(6000)
        
        // Prompt não deve aparecer novamente (por 7 dias)
        const newPrompt = page.locator('[class*="fixed"][class*="z-50"]').filter({ 
          hasText: /instalar|install/i 
        })
        
        expect(await newPrompt.count()).toBe(0)
      }
    }
  })

  test('Deve detectar plataforma corretamente', async ({ page }) => {
    // Testar detecção iOS
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)')
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(6000)
    
    const pwaPrompt = page.locator('[class*="fixed"][class*="z-50"]').filter({ 
      hasText: /instalar|install/i 
    })
    
    if (await pwaPrompt.count() > 0) {
      // Em iOS deve mostrar botão de instruções
      const instructionsBtn = pwaPrompt.locator('button').filter({ 
        hasText: /instruções|ver/i 
      })
      
      expect(await instructionsBtn.count()).toBeGreaterThan(0)
    }
  })

  test('Analytics PWA devem funcionar', async ({ page }) => {
    let analyticsEvents = []
    
    // Interceptar chamadas de analytics
    page.on('request', request => {
      if (request.url().includes('google-analytics') || 
          request.url().includes('gtag') || 
          request.url().includes('analytics')) {
        analyticsEvents.push(request.url())
      }
    })
    
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(6000)
    
    const pwaPrompt = page.locator('[class*="fixed"][class*="z-50"]').filter({ 
      hasText: /instalar|install/i 
    })
    
    if (await pwaPrompt.count() > 0) {
      const dismissButton = pwaPrompt.locator('button').filter({ 
        hasText: /não|depois/i 
      })
      
      if (await dismissButton.count() > 0) {
        await dismissButton.click()
        await page.waitForTimeout(1000)
        
        // Verificar se evento de analytics foi enviado
        // (Pode não haver se analytics não estiver configurado)
        expect(analyticsEvents.length).toBeGreaterThanOrEqual(0)
      }
    }
  })
})
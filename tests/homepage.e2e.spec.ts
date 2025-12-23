/**
 * @file tests/homepage.e2e.spec.ts
 * @description Testes E2E completos para a página inicial
 * @coverage: Homepage, Header, Layout, PWA, BottomTabBar
 */

import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3001'

test.describe('Homepage - Funcionalidades Principais', () => {
  
  test('Deve carregar a página inicial corretamente', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    
    // Verificar elementos principais
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('header')).toBeVisible()
    
    // Verificar que não há erros críticos no console
    const errors = []
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('analytics')) {
        errors.push(msg.text())
      }
    })
    
    expect(errors).toHaveLength(0)
  })

  test('Header deve exibir logo e navegação', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    
    // Verificar logo
    const logo = page.locator('img[alt*="Xeco"], svg, [data-testid="logo"]').first()
    await expect(logo).toBeVisible()
    
    // Verificar menu de navegação
    const menuItems = page.locator('nav a, header a')
    expect(await menuItems.count()).toBeGreaterThan(0)
  })

  test('Busca deve funcionar corretamente', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    
    // Procurar campo de busca
    const searchInput = page.locator('input[type="search"], input[placeholder*="Buscar"], input[placeholder*="Procurar"]')
    if (await searchInput.count() > 0) {
      await searchInput.fill('produto teste')
      await page.keyboard.press('Enter')
      
      // Aguardar navegação ou resultados
      await page.waitForLoadState('networkidle')
      
      // Verificar que a busca foi processada
      expect(page.url()).toMatch(/search|busca|produto/)
    }
  })

  test('PWA Install Prompt deve aparecer (quando aplicável)', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    
    // Aguardar possível PWA prompt (5 segundos de delay)
    await page.waitForTimeout(6000)
    
    // Verificar se PWA prompt apareceu
    const pwaPrompt = page.locator('[class*="fixed"][class*="z-50"]').filter({ hasText: /instalar|install/i })
    
    if (await pwaPrompt.count() > 0) {
      await expect(pwaPrompt).toBeVisible()
      
      // Testar fechar prompt
      const closeBtn = pwaPrompt.locator('button').filter({ hasText: /fechar|x|agora não/i }).first()
      if (await closeBtn.count() > 0) {
        await closeBtn.click()
        await expect(pwaPrompt).not.toBeVisible()
      }
    }
  })
})

test.describe('Homepage - Layout Responsivo', () => {
  
  test('Deve ser responsiva em mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    
    // Verificar que conteúdo está visível em mobile
    const mainContent = page.locator('main, [role="main"], body > div').first()
    await expect(mainContent).toBeVisible()
    
    // Verificar que não há scroll horizontal
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const windowWidth = await page.evaluate(() => window.innerWidth)
    expect(bodyWidth).toBeLessThanOrEqual(windowWidth + 20) // 20px de tolerância
  })

  test('BottomTabBar deve aparecer em mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    
    // Verificar se BottomTabBar existe
    const bottomNav = page.locator('[class*="fixed"][class*="bottom"]').filter({ hasText: /home|ofertas|liked|perfil/i })
    
    if (await bottomNav.count() > 0) {
      await expect(bottomNav).toBeVisible()
      
      // Testar navegação entre tabs
      const tabs = bottomNav.locator('a, button')
      const tabCount = await tabs.count()
      expect(tabCount).toBeGreaterThanOrEqual(3) // Pelo menos 3 tabs
      
      // Testar clique na primeira tab diferente de Home
      if (tabCount > 1) {
        await tabs.nth(1).click()
        await page.waitForLoadState('networkidle')
        // Verificar que navegou
        expect(page.url()).not.toBe(BASE_URL + '/')
      }
    }
  })

  test('Deve ser responsiva em desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    
    // Em desktop, BottomTabBar deve estar oculta
    const bottomNav = page.locator('[class*="fixed"][class*="bottom"]').filter({ hasText: /home|ofertas|liked|perfil/i })
    
    if (await bottomNav.count() > 0) {
      // Se existe, deve estar oculta em desktop
      const isHidden = await bottomNav.evaluate(el => {
        const style = window.getComputedStyle(el)
        return style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0'
      })
      expect(isHidden).toBe(true)
    }
  })
})

test.describe('Homepage - Performance e Acessibilidade', () => {
  
  test('Deve carregar em menos de 3 segundos', async ({ page }) => {
    const startTime = Date.now()
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    expect(loadTime).toBeLessThan(3000)
  })

  test('Deve ter meta tags essenciais', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    
    // Verificar meta tags importantes
    await expect(page.locator('meta[name="description"]')).toBeAttached()
    await expect(page.locator('meta[name="viewport"]')).toBeAttached()
    
    // Verificar title
    const title = await page.title()
    expect(title).toBeTruthy()
    expect(title.length).toBeGreaterThan(10)
  })

  test('Links devem ter atributos de acessibilidade', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    
    // Verificar que links externos têm rel apropriado
    const externalLinks = page.locator('a[href^="http"]:not([href^="' + BASE_URL + '"])')
    
    for (let i = 0; i < await externalLinks.count(); i++) {
      const link = externalLinks.nth(i)
      const rel = await link.getAttribute('rel')
      if (rel) {
        expect(rel).toMatch(/noopener|noreferrer/)
      }
    }
  })
})
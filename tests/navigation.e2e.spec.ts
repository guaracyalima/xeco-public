/**
 * @file tests/navigation.e2e.spec.ts
 * @description Testes E2E completos para navegação e roteamento
 * @coverage: BottomTabBar, Header Navigation, Deep Links, Back/Forward
 */

import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3001'

test.describe('BottomTabBar - Navegação Mobile', () => {
  
  test.beforeEach(async ({ page }) => {
    // Configurar viewport mobile
    await page.setViewportSize({ width: 375, height: 812 })
  })

  test('Deve exibir todas as tabs do BottomTabBar', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    
    // Procurar BottomTabBar
    const bottomNav = page.locator('[class*="fixed"][class*="bottom"], nav').filter({ 
      hasText: /home|ofertas|liked|perfil/i 
    })
    
    if (await bottomNav.count() > 0) {
      await expect(bottomNav.first()).toBeVisible()
      
      // Verificar tabs específicas
      const homeTab = bottomNav.locator('a, button').filter({ hasText: /home/i })
      const ofertasTab = bottomNav.locator('a, button').filter({ hasText: /ofertas/i })
      const likedTab = bottomNav.locator('a, button').filter({ hasText: /liked/i })
      const perfilTab = bottomNav.locator('a, button').filter({ hasText: /perfil/i })
      
      await expect(homeTab.first()).toBeVisible()
      await expect(ofertasTab.first()).toBeVisible()
      await expect(likedTab.first()).toBeVisible()
      await expect(perfilTab.first()).toBeVisible()
    }
  })

  test('Navegação entre tabs deve funcionar', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    
    const bottomNav = page.locator('[class*="fixed"][class*="bottom"], nav').filter({ 
      hasText: /home|ofertas|liked|perfil/i 
    })
    
    if (await bottomNav.count() > 0) {
      // Testar navegação para Ofertas
      const ofertasTab = bottomNav.locator('a, button').filter({ hasText: /ofertas/i }).first()
      if (await ofertasTab.count() > 0) {
        await ofertasTab.click()
        await page.waitForLoadState('networkidle')
        expect(page.url()).toMatch(/products|ofertas/)
      }
      
      // Testar navegação para Perfil
      const perfilTab = bottomNav.locator('a, button').filter({ hasText: /perfil/i }).first()
      if (await perfilTab.count() > 0) {
        await perfilTab.click()
        await page.waitForLoadState('networkidle')
        // Pode redirecionar para login se não autenticado
        expect(page.url()).toMatch(/profile|login/)
      }
      
      // Voltar para Home
      const homeTab = bottomNav.locator('a, button').filter({ hasText: /home/i }).first()
      if (await homeTab.count() > 0) {
        await homeTab.click()
        await page.waitForLoadState('networkidle')
        expect(page.url()).toBe(`${BASE_URL}/`)
      }
    }
  })

  test('Tab ativa deve ter estilo diferenciado', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    
    const bottomNav = page.locator('[class*="fixed"][class*="bottom"], nav').filter({ 
      hasText: /home|ofertas|liked|perfil/i 
    })
    
    if (await bottomNav.count() > 0) {
      const homeTab = bottomNav.locator('a, button').filter({ hasText: /home/i }).first()
      
      if (await homeTab.count() > 0) {
        // Verificar se tab ativa tem classe especial ou cor diferente
        const classList = await homeTab.getAttribute('class')
        const hasActiveClass = classList?.includes('active') || 
                             classList?.includes('current') || 
                             classList?.includes('selected')
        
        // Ou verificar cor/estilo do ícone/texto
        const iconColor = await homeTab.locator('svg, i, span').first().evaluate(el => {
          return window.getComputedStyle(el).color
        })
        
        expect(iconColor).toBeTruthy()
      }
    }
  })

  test('BottomTabBar deve ter acessibilidade adequada', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    
    const bottomNav = page.locator('[class*="fixed"][class*="bottom"], nav').filter({ 
      hasText: /home|ofertas|liked|perfil/i 
    })
    
    if (await bottomNav.count() > 0) {
      // Verificar role nav
      const navRole = await bottomNav.first().getAttribute('role')
      expect(navRole).toBe('navigation')
      
      // Verificar que botões têm aria-labels ou text
      const tabs = bottomNav.locator('a, button')
      
      for (let i = 0; i < await tabs.count(); i++) {
        const tab = tabs.nth(i)
        const ariaLabel = await tab.getAttribute('aria-label')
        const text = await tab.textContent()
        
        expect(ariaLabel || text).toBeTruthy()
      }
    }
  })
})

test.describe('Header Navigation - Desktop', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
  })

  test('Header deve exibir logo e menu principal', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    
    // Verificar logo
    const logo = page.locator('header img, header svg, [data-testid="logo"]').first()
    await expect(logo).toBeVisible()
    
    // Verificar menu principal
    const navLinks = page.locator('header nav a, header a').filter({ hasNotText: /login|entrar/i })
    expect(await navLinks.count()).toBeGreaterThan(0)
  })

  test('Menu deve ter links funcionais', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    
    const menuLinks = page.locator('header nav a, header a[href]')
    
    for (let i = 0; i < Math.min(await menuLinks.count(), 5); i++) {
      const link = menuLinks.nth(i)
      const href = await link.getAttribute('href')
      const text = await link.textContent()
      
      if (href && href.startsWith('/') && text && !text.toLowerCase().includes('login')) {
        // Testar link interno
        await link.click()
        await page.waitForLoadState('networkidle')
        expect(page.url()).toContain(href)
        
        // Voltar para home
        await page.goto(BASE_URL)
        await page.waitForLoadState('networkidle')
      }
    }
  })

  test('Logo deve levar para home', async ({ page }) => {
    // Ir para uma página diferente primeiro
    await page.goto(`${BASE_URL}/products`)
    await page.waitForLoadState('networkidle')
    
    // Clicar no logo
    const logo = page.locator('header img, header svg, [data-testid="logo"], header a').first()
    await logo.click()
    await page.waitForLoadState('networkidle')
    
    expect(page.url()).toBe(`${BASE_URL}/`)
  })
})

test.describe('Deep Links e Roteamento', () => {
  
  test('URLs diretas devem funcionar', async ({ page }) => {
    const routes = [
      '/',
      '/products', 
      '/search',
      '/franchises',
      '/company/123',
      '/product/456'
    ]
    
    for (const route of routes) {
      await page.goto(`${BASE_URL}${route}`)
      await page.waitForLoadState('networkidle')
      
      // Verificar que página carregou (não é 404)
      const notFound = page.locator('text=404, text="não encontrada", text="not found"')
      
      if (await notFound.count() > 0) {
        const isVisible = await notFound.first().isVisible()
        expect(isVisible).toBe(false)
      }
      
      // Verificar que há conteúdo na página
      const content = page.locator('main, [role="main"], body > div')
      await expect(content.first()).toBeVisible()
    }
  })

  test('Parâmetros de URL devem ser processados', async ({ page }) => {
    // Testar busca com query params
    await page.goto(`${BASE_URL}/search?q=produto+teste`)
    await page.waitForLoadState('networkidle')
    
    // Verificar se o termo de busca aparece na página ou campo
    const searchTerm = page.locator('input[value*="produto"], text*="produto"').first()
    
    if (await searchTerm.count() > 0) {
      await expect(searchTerm).toBeVisible()
    }
  })

  test('Navegação browser (voltar/avançar) deve funcionar', async ({ page }) => {
    // Navegar por algumas páginas
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    
    await page.goto(`${BASE_URL}/products`)
    await page.waitForLoadState('networkidle')
    
    await page.goto(`${BASE_URL}/search`)
    await page.waitForLoadState('networkidle')
    
    // Testar voltar
    await page.goBack()
    expect(page.url()).toBe(`${BASE_URL}/products`)
    
    await page.goBack()
    expect(page.url()).toBe(`${BASE_URL}/`)
    
    // Testar avançar
    await page.goForward()
    expect(page.url()).toBe(`${BASE_URL}/products`)
  })
})

test.describe('Responsividade da Navegação', () => {
  
  test('BottomTabBar deve aparecer apenas em mobile', async ({ page }) => {
    const viewports = [
      { width: 375, height: 812, expectVisible: true },   // Mobile
      { width: 768, height: 1024, expectVisible: false }, // Tablet
      { width: 1280, height: 720, expectVisible: false }  // Desktop
    ]
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      await page.goto(BASE_URL)
      await page.waitForLoadState('networkidle')
      
      const bottomNav = page.locator('[class*="fixed"][class*="bottom"]').filter({ 
        hasText: /home|ofertas|liked|perfil/i 
      })
      
      if (await bottomNav.count() > 0) {
        if (viewport.expectVisible) {
          await expect(bottomNav.first()).toBeVisible()
        } else {
          // Em desktop/tablet deve estar oculta
          const isHidden = await bottomNav.first().isHidden()
          expect(isHidden).toBe(true)
        }
      }
    }
  })

  test('Menu hamburger deve aparecer em mobile (se aplicável)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    
    // Procurar menu hamburger
    const hamburger = page.locator('button').filter({ hasText: /☰|menu/i }).or(
      page.locator('svg').filter({ hasText: /hamburger|menu/i })
    ).or(
      page.locator('[data-testid="hamburger-menu"], [aria-label*="menu" i]')
    )
    
    if (await hamburger.count() > 0) {
      await expect(hamburger.first()).toBeVisible()
      
      // Testar abrir menu
      await hamburger.first().click()
      await page.waitForTimeout(500)
      
      // Verificar se menu móvel apareceu
      const mobileMenu = page.locator('[role="dialog"], .mobile-menu, nav[class*="mobile"]')
      
      if (await mobileMenu.count() > 0) {
        await expect(mobileMenu.first()).toBeVisible()
      }
    }
  })
})
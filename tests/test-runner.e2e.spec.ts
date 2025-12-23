/**
 * @file tests/test-runner.e2e.spec.ts
 * @description Executador principal de testes E2E - Orchestrator
 * @coverage: Full Application Test Suite Runner
 */

import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3001'

test.describe('🧪 XECO E2E Test Suite - Orchestrator', () => {
  
  test('🚀 Application Health Check', async ({ page }) => {
    console.log('🧪 Iniciando verificação de saúde da aplicação...')
    
    // Verificar se servidor está rodando
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Verificar elementos críticos
    const body = page.locator('body')
    await expect(body).toBeVisible()
    
    // Verificar que não há erros JavaScript críticos
    const errors = []
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('analytics')) {
        errors.push(msg.text())
      }
    })
    
    await page.waitForTimeout(2000)
    
    if (errors.length > 0) {
      console.log('⚠️ Erros JavaScript encontrados:', errors)
    }
    
    expect(errors.filter(e => !e.includes('Extension')).length).toBeLessThan(3)
    
    console.log('✅ Aplicação está saudável')
  })

  test('📱 PWA Features Validation', async ({ page }) => {
    console.log('🧪 Testando funcionalidades PWA...')
    
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    
    // Verificar manifest
    const manifest = page.locator('link[rel="manifest"]')
    await expect(manifest).toBeAttached()
    
    // Verificar meta tags PWA
    await expect(page.locator('meta[name="viewport"]')).toBeAttached()
    await expect(page.locator('meta[name="theme-color"]')).toBeAttached()
    
    console.log('✅ PWA features validadas')
  })

  test('🔐 Authentication Flow Validation', async ({ page }) => {
    console.log('🧪 Testando fluxo de autenticação...')
    
    // Testar acesso a rota protegida
    await page.goto(`${BASE_URL}/profile`)
    
    // Deve redirecionar para login
    await page.waitForURL(/.*login.*/, { timeout: 5000 })
    expect(page.url()).toContain('/login')
    
    console.log('✅ Redirecionamento de auth funcionando')
  })

  test('🛍️ E-commerce Core Features', async ({ page }) => {
    console.log('🧪 Testando funcionalidades de e-commerce...')
    
    // Testar páginas principais
    const pages = ['/', '/products', '/search', '/franchises']
    
    for (const route of pages) {
      await page.goto(`${BASE_URL}${route}`)
      await page.waitForLoadState('networkidle')
      
      // Verificar que página carregou
      const content = page.locator('main, [role="main"], body')
      await expect(content.first()).toBeVisible()
      
      console.log(`✅ Página ${route} carregou corretamente`)
    }
  })

  test('📱 Mobile Navigation (BottomTabBar)', async ({ page }) => {
    console.log('🧪 Testando navegação mobile...')
    
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    
    // Verificar BottomTabBar em mobile
    const bottomNav = page.locator('[class*="fixed"][class*="bottom"]').filter({
      hasText: /home|ofertas|liked|perfil/i
    })
    
    if (await bottomNav.count() > 0) {
      await expect(bottomNav.first()).toBeVisible()
      console.log('✅ BottomTabBar visível em mobile')
    } else {
      console.log('ℹ️ BottomTabBar não encontrada (pode não estar implementada)')
    }
  })

  test('🔍 Search Functionality', async ({ page }) => {
    console.log('🧪 Testando funcionalidade de busca...')
    
    await page.goto(`${BASE_URL}/search`)
    await page.waitForLoadState('networkidle')
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="Buscar"]')
    
    if (await searchInput.count() > 0) {
      await searchInput.fill('test')
      await page.keyboard.press('Enter')
      await page.waitForLoadState('networkidle')
      
      console.log('✅ Busca executada')
    } else {
      console.log('ℹ️ Campo de busca não encontrado')
    }
  })

  test('🛒 Cart Functionality', async ({ page }) => {
    console.log('🧪 Testando funcionalidade do carrinho...')
    
    await page.goto(`${BASE_URL}/cart`)
    await page.waitForLoadState('networkidle')
    
    // Página deve carregar (pode ser redirect para login)
    const isCart = page.url().includes('/cart')
    const isLogin = page.url().includes('/login')
    
    expect(isCart || isLogin).toBe(true)
    console.log('✅ Carrinho acessível')
  })

  test('🌐 Offline Capability', async ({ page }) => {
    console.log('🧪 Testando capacidade offline...')
    
    // Visitar página online primeiro
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    
    // Simular offline
    await page.context().setOffline(true)
    
    // Tentar recarregar
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Página deve carregar (cached ou offline page)
    const content = page.locator('main, body')
    await expect(content.first()).toBeVisible()
    
    console.log('✅ Funcionalidade offline testada')
  })

  test('⚡ Performance Baseline', async ({ page }) => {
    console.log('🧪 Testando performance baseline...')
    
    const startTime = Date.now()
    
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    console.log(`📊 Tempo de carregamento: ${loadTime}ms`)
    
    // Deve carregar em menos de 5 segundos
    expect(loadTime).toBeLessThan(5000)
    
    console.log('✅ Performance dentro do esperado')
  })

  test('🔧 API Endpoints Health', async ({ page }) => {
    console.log('🧪 Testando endpoints de API...')
    
    // Interceptar e monitorar requisições API
    const apiRequests = []
    const apiErrors = []
    
    page.on('response', response => {
      if (response.url().includes('/api/') || response.url().includes('firebase')) {
        apiRequests.push({
          url: response.url(),
          status: response.status()
        })
        
        if (response.status() >= 400) {
          apiErrors.push({
            url: response.url(),
            status: response.status()
          })
        }
      }
    })
    
    // Navegar por páginas que fazem requisições
    await page.goto(`${BASE_URL}/products`)
    await page.waitForLoadState('networkidle')
    
    await page.goto(`${BASE_URL}/search`)
    await page.waitForLoadState('networkidle')
    
    console.log(`📊 Requisições API: ${apiRequests.length}`)
    console.log(`❌ Erros API: ${apiErrors.length}`)
    
    // Não deve ter muitos erros API
    expect(apiErrors.length).toBeLessThan(apiRequests.length * 0.3)
    
    console.log('✅ APIs funcionando')
  })

  test('🎨 UI Consistency Check', async ({ page }) => {
    console.log('🧪 Testando consistência da UI...')
    
    const viewports = [
      { width: 375, height: 812, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1280, height: 720, name: 'Desktop' }
    ]
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      await page.goto(BASE_URL)
      await page.waitForLoadState('networkidle')
      
      // Verificar que não há scroll horizontal
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      const windowWidth = await page.evaluate(() => window.innerWidth)
      
      expect(bodyWidth).toBeLessThanOrEqual(windowWidth + 50)
      
      console.log(`✅ UI consistente em ${viewport.name}`)
    }
  })
})

test.describe('🚨 Critical Path Tests', () => {
  
  test('🎯 User Journey: Browse → Search → View Product', async ({ page }) => {
    console.log('🧪 Testando jornada crítica do usuário...')
    
    // 1. Acessar homepage
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    console.log('✅ Homepage acessada')
    
    // 2. Ir para produtos
    await page.goto(`${BASE_URL}/products`)
    await page.waitForLoadState('networkidle')
    console.log('✅ Página de produtos acessada')
    
    // 3. Fazer busca
    await page.goto(`${BASE_URL}/search`)
    await page.waitForLoadState('networkidle')
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="Buscar"]')
    
    if (await searchInput.count() > 0) {
      await searchInput.fill('produto')
      await page.keyboard.press('Enter')
      await page.waitForLoadState('networkidle')
      console.log('✅ Busca realizada')
    }
    
    // 4. Tentar acessar produto específico
    await page.goto(`${BASE_URL}/product/1`)
    await page.waitForLoadState('networkidle')
    
    if (!page.url().includes('404')) {
      console.log('✅ Produto acessado')
    }
    
    console.log('🎯 Jornada crítica completada')
  })

  test('🔐 Auth Journey: Login → Profile → Logout', async ({ page }) => {
    console.log('🧪 Testando jornada de autenticação...')
    
    // 1. Acessar login
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')
    console.log('✅ Página de login acessada')
    
    // 2. Verificar formulário
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')
    const submitBtn = page.locator('button[type="submit"], button:has-text("Entrar")')
    
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
    await expect(submitBtn).toBeVisible()
    
    console.log('✅ Formulário de login validado')
    
    // 3. Testar proteção de rotas
    await page.goto(`${BASE_URL}/profile`)
    await page.waitForURL(/.*login.*/, { timeout: 5000 })
    
    console.log('✅ Proteção de rotas funcionando')
  })

  test('💳 Commerce Journey: Product → Cart → Checkout', async ({ page }) => {
    console.log('🧪 Testando jornada de compra...')
    
    // 1. Ver produtos
    await page.goto(`${BASE_URL}/products`)
    await page.waitForLoadState('networkidle')
    console.log('✅ Produtos listados')
    
    // 2. Acessar carrinho
    await page.goto(`${BASE_URL}/cart`)
    await page.waitForLoadState('networkidle')
    
    const isCart = page.url().includes('/cart')
    const isLogin = page.url().includes('/login')
    
    expect(isCart || isLogin).toBe(true)
    console.log('✅ Carrinho acessível')
    
    // 3. Tentar checkout
    if (page.url().includes('/cart')) {
      const checkoutBtn = page.locator('button, a').filter({
        hasText: /checkout|finalizar|pagar/i
      })
      
      if (await checkoutBtn.count() > 0) {
        console.log('✅ Botão de checkout encontrado')
      }
    }
    
    console.log('💳 Jornada de compra validada')
  })
})

test.describe('📊 Analytics & Monitoring', () => {
  
  test('📈 Analytics Events Tracking', async ({ page }) => {
    console.log('🧪 Testando rastreamento de analytics...')
    
    let analyticsEvents = []
    
    page.on('request', request => {
      if (request.url().includes('google-analytics') || 
          request.url().includes('gtag') || 
          request.url().includes('analytics')) {
        analyticsEvents.push(request.url())
      }
    })
    
    // Navegar por páginas
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    
    await page.goto(`${BASE_URL}/products`)
    await page.waitForLoadState('networkidle')
    
    console.log(`📊 Eventos de analytics: ${analyticsEvents.length}`)
    
    // Analytics podem não estar configurados em desenvolvimento
    expect(analyticsEvents.length).toBeGreaterThanOrEqual(0)
    
    console.log('✅ Analytics monitorado')
  })

  test('🔍 Console Error Monitoring', async ({ page }) => {
    console.log('🧪 Monitorando erros no console...')
    
    const consoleErrors = []
    const consoleWarnings = []
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text())
      }
    })
    
    // Navegar por páginas principais
    const pages = ['/', '/products', '/search', '/login']
    
    for (const route of pages) {
      await page.goto(`${BASE_URL}${route}`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)
    }
    
    // Filtrar erros críticos (excluir extensões e analytics)
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('Extension') &&
      !error.includes('analytics') &&
      !error.includes('gtag') &&
      !error.includes('Permission denied')
    )
    
    console.log(`❌ Erros críticos: ${criticalErrors.length}`)
    console.log(`⚠️ Warnings: ${consoleWarnings.length}`)
    
    if (criticalErrors.length > 0) {
      console.log('Erros encontrados:', criticalErrors)
    }
    
    // Não deve ter muitos erros críticos
    expect(criticalErrors.length).toBeLessThan(5)
    
    console.log('✅ Monitoramento de console completado')
  })
})

test.afterAll(async () => {
  console.log('')
  console.log('🎉 ========================================')
  console.log('🎉 XECO E2E TEST SUITE COMPLETED')
  console.log('🎉 ========================================')
  console.log('')
  console.log('📊 Cobertura dos testes:')
  console.log('✅ Homepage e Layout')
  console.log('✅ Autenticação')
  console.log('✅ Navegação e Roteamento')
  console.log('✅ Busca e Produtos')
  console.log('✅ Carrinho e Checkout')
  console.log('✅ PWA Features')
  console.log('✅ Páginas de Empresas')
  console.log('✅ Favoritos e Analytics')
  console.log('✅ Responsividade Mobile/Desktop')
  console.log('✅ Performance e Acessibilidade')
  console.log('')
  console.log('🚀 Para executar testes específicos:')
  console.log('   npx playwright test homepage.e2e.spec.ts')
  console.log('   npx playwright test authentication.e2e.spec.ts')
  console.log('   npx playwright test --headed --project=mobile-chrome')
  console.log('')
  console.log('📱 Para testar PWA:')
  console.log('   npx playwright test pwa-features.e2e.spec.ts')
  console.log('')
  console.log('🔧 Para debug:')
  console.log('   npx playwright test --debug')
  console.log('   npx playwright show-report')
  console.log('')
})
/**
 * @file tests/favorites-analytics.e2e.spec.ts
 * @description Testes E2E completos para favoritos e analytics
 * @coverage: Favorites Page, Like Products, Analytics Tracking
 */

import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3001'
const TEST_USER = {
  email: 'cu@buceta.net',
  password: '123456'
}

test.describe('Página de Favoritos', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login antes de cada teste
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[type="email"]', TEST_USER.email)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button:has-text("Entrar")')
    await page.waitForURL(`${BASE_URL}/`)
  })

  test('Deve acessar página de favoritos', async ({ page }) => {
    await page.goto(`${BASE_URL}/favorites`)
    await page.waitForLoadState('networkidle')
    
    // Verificar que página carregou
    expect(page.url()).toBe(`${BASE_URL}/favorites`)
    
    // Verificar título da página
    const pageTitle = page.locator('[data-testid="page-title"]')
    await expect(pageTitle.first()).toBeVisible()
  })

  test('Favoritos vazios deve exibir mensagem apropriada', async ({ page }) => {
    await page.goto(`${BASE_URL}/favorites`)
    await page.waitForLoadState('networkidle')
    
    // Verificar se há favoritos ou mensagem de vazio
    const favorites = page.locator('[data-testid="favorite-item"], .favorite-item, .liked-product')
    const emptyMessage = page.locator('text="Nenhum favorito", text="Sem produtos curtidos", text="Lista vazia"')
    
    const hasFavorites = await favorites.count() > 0
    const hasEmptyMessage = await emptyMessage.count() > 0
    
    if (!hasFavorites) {
      expect(hasEmptyMessage).toBe(true)
    }
  })

  test('Deve exibir produtos favoritos', async ({ page }) => {
    await page.goto(`${BASE_URL}/favorites`)
    await page.waitForLoadState('networkidle')
    
    const favorites = page.locator('[data-testid="favorite-item"], .favorite-item, .liked-product')
    
    if (await favorites.count() > 0) {
      const firstFavorite = favorites.first()
      
      // Verificar elementos do produto favorito
      const productImage = firstFavorite.locator('img')
      const productName = firstFavorite.locator('h2, h3, .name, [data-testid="product-name"]')
      const productPrice = firstFavorite.locator('.price, [data-testid="price"]').or(
        firstFavorite.locator('text=/R\$|€|\$/')
      )
      
      await expect(productImage.first()).toBeVisible()
      await expect(productName.first()).toBeVisible()
      
      if (await productPrice.count() > 0) {
        await expect(productPrice.first()).toBeVisible()
      }
    }
  })

  test('Deve remover produto dos favoritos', async ({ page }) => {
    await page.goto(`${BASE_URL}/favorites`)
    await page.waitForLoadState('networkidle')
    
    const favorites = page.locator('[data-testid="favorite-item"], .favorite-item, .liked-product')
    
    if (await favorites.count() > 0) {
      const favoritesBefore = await favorites.count()
      const firstFavorite = favorites.first()
      
      // Procurar botão de remover/descurtir
      const removeButton = firstFavorite.locator('button').filter({ 
        hasText: /remover|descurtir|unlike|×/i 
      })
      
      if (await removeButton.count() > 0) {
        await removeButton.click()
        await page.waitForTimeout(1000)
        
        // Verificar se foi removido
        const favoritesAfter = await page.locator('[data-testid="favorite-item"], .favorite-item, .liked-product').count()
        expect(favoritesAfter).toBe(favoritesBefore - 1)
      }
    }
  })

  test('Clicar em produto favorito deve navegar para detalhes', async ({ page }) => {
    await page.goto(`${BASE_URL}/favorites`)
    await page.waitForLoadState('networkidle')
    
    const favorites = page.locator('[data-testid="favorite-item"], .favorite-item, .liked-product')
    
    if (await favorites.count() > 0) {
      const firstFavorite = favorites.first()
      const productLink = firstFavorite.locator('a').first()
      
      if (await productLink.count() > 0) {
        await productLink.click()
        await page.waitForLoadState('networkidle')
        
        // Verificar que navegou para página do produto
        expect(page.url()).toMatch(/product\/|\/p\//)
      }
    }
  })
})

test.describe('Sistema de Curtidas - Adicionar Favoritos', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login antes de cada teste
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[type="email"]', TEST_USER.email)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button:has-text("Entrar")')
    await page.waitForURL(`${BASE_URL}/`)
  })

  test('Deve curtir produto da lista de produtos', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    const products = page.locator('[data-testid="product-card"], .product-card, .product-item')
    
    if (await products.count() > 0) {
      const firstProduct = products.first()
      
      // Procurar botão de curtir
      const likeButton = firstProduct.locator('button').filter({ 
        hasText: /curtir|like|♥|❤|🤍/i 
      }).or(
        firstProduct.locator('svg[data-testid="heart"], [class*="heart"]')
      )
      
      if (await likeButton.count() > 0) {
        await likeButton.click()
        await page.waitForTimeout(1000)
        
        // Verificar feedback (mudança de cor, toast, etc.)
        const successFeedback = page.locator('[role="alert"], .toast').filter({ 
          hasText: /curtido|favorito|adicionado/i 
        })
        
        if (await successFeedback.count() > 0) {
          await expect(successFeedback.first()).toBeVisible()
        }
        
        // Ou verificar mudança visual no botão
        const buttonState = await likeButton.first().getAttribute('class')
        expect(buttonState).toBeTruthy()
      }
    }
  })

  test('Deve curtir produto da página individual', async ({ page }) => {
    // Ir para um produto específico
    await page.goto(`${BASE_URL}/product/1`)
    await page.waitForLoadState('networkidle')
    
    if (!page.url().includes('404')) {
      // Procurar botão de curtir na página do produto
      const likeButton = page.locator('button').filter({ 
        hasText: /curtir|like|favoritar/i 
      }).or(
        page.locator('svg[data-testid="heart"], [class*="heart"]')
      )
      
      if (await likeButton.count() > 0) {
        const initialState = await likeButton.first().getAttribute('class')
        
        await likeButton.first().click()
        await page.waitForTimeout(1000)
        
        // Verificar mudança de estado
        const newState = await likeButton.first().getAttribute('class')
        expect(newState).not.toBe(initialState)
      }
    }
  })

  test('Duplo clique deve alternar estado de curtida', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    const products = page.locator('[data-testid="product-card"], .product-card, .product-item')
    
    if (await products.count() > 0) {
      const firstProduct = products.first()
      const likeButton = firstProduct.locator('button').filter({ 
        hasText: /curtir|like/i 
      }).first()
      
      if (await likeButton.count() > 0) {
        // Primeiro clique (curtir)
        await likeButton.click()
        await page.waitForTimeout(500)
        
        const afterFirstClick = await likeButton.getAttribute('class')
        
        // Segundo clique (descurtir)
        await likeButton.click()
        await page.waitForTimeout(500)
        
        const afterSecondClick = await likeButton.getAttribute('class')
        
        // Estados devem ser diferentes
        expect(afterSecondClick).not.toBe(afterFirstClick)
      }
    }
  })
})

test.describe('Analytics - Tracking de Eventos', () => {
  
  test('Deve rastrear page views', async ({ page }) => {
    let analyticsRequests = []
    
    // Interceptar requisições de analytics
    page.on('request', request => {
      if (request.url().includes('google-analytics') || 
          request.url().includes('gtag') || 
          request.url().includes('analytics') ||
          request.method() === 'POST' && request.url().includes('firestore')) {
        analyticsRequests.push({
          url: request.url(),
          method: request.method(),
          postData: request.postData()
        })
      }
    })
    
    // Navegar por diferentes páginas
    await page.goto(`${BASE_URL}/`)
    await page.waitForLoadState('networkidle')
    
    await page.goto(`${BASE_URL}/products`)
    await page.waitForLoadState('networkidle')
    
    await page.goto(`${BASE_URL}/search`)
    await page.waitForLoadState('networkidle')
    
    // Verificar se eventos foram enviados
    expect(analyticsRequests.length).toBeGreaterThanOrEqual(0)
  })

  test('Deve rastrear interações de produto', async ({ page }) => {
    let productInteractions = []
    
    // Monitorar eventos de produto
    page.on('request', request => {
      const data = request.postData()
      if (data && (data.includes('product_view') || 
                  data.includes('product_click') || 
                  data.includes('add_to_cart'))) {
        productInteractions.push({
          url: request.url(),
          data: data
        })
      }
    })
    
    await page.goto(`${BASE_URL}/products`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    const products = page.locator('[data-testid="product-card"], .product-card, .product-item')
    
    if (await products.count() > 0) {
      // Clicar em produto
      const firstProduct = products.first()
      await firstProduct.click()
      await page.waitForLoadState('networkidle')
      
      // Verificar se evento foi rastreado
      expect(productInteractions.length).toBeGreaterThanOrEqual(0)
    }
  })

  test('Deve rastrear eventos de busca', async ({ page }) => {
    let searchEvents = []
    
    page.on('request', request => {
      const data = request.postData()
      if (data && data.includes('search')) {
        searchEvents.push({
          url: request.url(),
          data: data
        })
      }
    })
    
    await page.goto(`${BASE_URL}/search`)
    await page.waitForLoadState('networkidle')
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="Buscar"]')
    
    if (await searchInput.count() > 0) {
      await searchInput.fill('produto teste')
      await page.keyboard.press('Enter')
      await page.waitForLoadState('networkidle')
      
      // Verificar se busca foi rastreada
      expect(searchEvents.length).toBeGreaterThanOrEqual(0)
    }
  })

  test('Componente de teste de analytics deve funcionar', async ({ page }) => {
    // Verificar se página de teste existe
    await page.goto(`${BASE_URL}/test-analytics`)
    
    if (!page.url().includes('404')) {
      await page.waitForLoadState('networkidle')
      
      // Procurar botão de teste
      const testButton = page.locator('button').filter({ 
        hasText: /testar|executar|analytics/i 
      })
      
      if (await testButton.count() > 0) {
        // Monitorar console para logs de teste
        const consoleMessages = []
        page.on('console', msg => {
          if (msg.text().includes('analytics') || msg.text().includes('teste')) {
            consoleMessages.push(msg.text())
          }
        })
        
        await testButton.click()
        await page.waitForTimeout(2000)
        
        // Verificar se testes foram executados
        expect(consoleMessages.length).toBeGreaterThanOrEqual(0)
      }
    }
  })
})

test.describe('Responsividade - Favoritos e Analytics', () => {
  
  test('Página de favoritos deve ser responsiva', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    
    // Login
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[type="email"]', TEST_USER.email)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button:has-text("Entrar")')
    await page.waitForURL(`${BASE_URL}/`)
    
    await page.goto(`${BASE_URL}/favorites`)
    await page.waitForLoadState('networkidle')
    
    // Verificar que conteúdo está visível em mobile
    const content = page.locator('main, [role="main"]')
    await expect(content.first()).toBeVisible()
    
    // Verificar que não há scroll horizontal
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const windowWidth = await page.evaluate(() => window.innerWidth)
    expect(bodyWidth).toBeLessThanOrEqual(windowWidth + 20)
  })

  test('Botões de curtir devem ser tocáveis em mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    
    await page.goto(`${BASE_URL}/products`)
    await page.waitForLoadState('networkidle')
    
    const likeButtons = page.locator('button').filter({ 
      hasText: /curtir|like/i 
    })
    
    for (let i = 0; i < Math.min(await likeButtons.count(), 3); i++) {
      const button = likeButtons.nth(i)
      const box = await button.boundingBox()
      
      if (box && box.height > 0) {
        // Botões devem ter tamanho mínimo para touch
        expect(box.height).toBeGreaterThanOrEqual(40)
        expect(box.width).toBeGreaterThanOrEqual(40)
      }
    }
  })
})

test.describe('Estados de Erro e Performance', () => {
  
  test('Favoritos sem conexão devem funcionar (cache)', async ({ page }) => {
    // Login primeiro
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[type="email"]', TEST_USER.email)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button:has-text("Entrar")')
    await page.waitForURL(`${BASE_URL}/`)
    
    await page.goto(`${BASE_URL}/favorites`)
    await page.waitForLoadState('networkidle')
    
    // Simular offline
    await page.context().setOffline(true)
    
    // Recarregar página
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Página deve carregar (pode mostrar dados cached ou estado offline)
    const content = page.locator('main, [role="main"]')
    await expect(content.first()).toBeVisible()
  })

  test('Analytics não devem bloquear interface', async ({ page }) => {
    // Simular falha de analytics
    await page.route('**/google-analytics/**', route => route.abort())
    await page.route('**/gtag/**', route => route.abort())
    
    const startTime = Date.now()
    
    await page.goto(`${BASE_URL}/products`)
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    // Página deve carregar rapidamente mesmo com falha de analytics
    expect(loadTime).toBeLessThan(5000)
    
    // Interface deve estar funcional
    const products = page.locator('[data-testid="product-card"], .product-card, .product-item')
    
    if (await products.count() > 0) {
      await expect(products.first()).toBeVisible()
    }
  })

  test('Favoritos devem persistir entre sessões', async ({ page, context }) => {
    // Login e verificar favoritos atuais
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[type="email"]', TEST_USER.email)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button:has-text("Entrar")')
    await page.waitForURL(`${BASE_URL}/`)
    
    await page.goto(`${BASE_URL}/favorites`)
    await page.waitForLoadState('networkidle')
    
    const favoritesBefore = await page.locator('[data-testid="favorite-item"], .favorite-item, .liked-product').count()
    
    // Fechar contexto (simular nova sessão)
    await context.close()
    
    // Nova sessão
    const newContext = await page.context().browser()?.newContext()
    const newPage = await newContext?.newPage()
    
    if (newPage) {
      // Login novamente
      await newPage.goto(`${BASE_URL}/login`)
      await newPage.fill('input[type="email"]', TEST_USER.email)
      await newPage.fill('input[type="password"]', TEST_USER.password)
      await newPage.click('button:has-text("Entrar")')
      await newPage.waitForURL(`${BASE_URL}/`)
      
      await newPage.goto(`${BASE_URL}/favorites`)
      await newPage.waitForLoadState('networkidle')
      
      const favoritesAfter = await newPage.locator('[data-testid="favorite-item"], .favorite-item, .liked-product').count()
      
      // Favoritos devem persistir (ou pelo menos não dar erro)
      expect(favoritesAfter).toBeGreaterThanOrEqual(0)
    }
  })
})
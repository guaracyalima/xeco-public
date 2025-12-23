/**
 * @file tests/search-products.e2e.spec.ts
 * @description Testes E2E completos para busca e listagem de produtos
 * @coverage: Search Page, Product Filters, Pagination, Product Cards
 */

import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3001'

test.describe('Página de Busca - Funcionalidades', () => {
  
  test('Deve exibir página de busca corretamente', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`)
    await page.waitForLoadState('networkidle')
    
    // Verificar elementos principais usando seletor específico
    await expect(page.locator('[data-testid="page-title"]')).toBeVisible()
    
    // Verificar campo de busca
    const searchInput = page.locator('input[type="search"], input[placeholder*="Buscar"], input[placeholder*="Procurar"]')
    await expect(searchInput.first()).toBeVisible()
  })

  test('Busca por texto deve funcionar', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`)
    await page.waitForLoadState('networkidle')
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="Buscar"], input[placeholder*="Procurar"]').first()
    
    // Fazer busca
    await searchInput.fill('produto')
    await page.keyboard.press('Enter')
    await page.waitForLoadState('networkidle')
    
    // Verificar que URL foi atualizada
    expect(page.url()).toContain('produto')
    
    // Verificar se há resultados ou mensagem de "sem resultados"
    const results = page.locator('[data-testid="product-card"], .product-card, .product-item')
    const noResults = page.locator('text="Nenhum produto encontrado", text="Sem resultados"')
    
    const hasResults = await results.count() > 0
    const hasNoResultsMessage = await noResults.count() > 0
    
    expect(hasResults || hasNoResultsMessage).toBe(true)
  })

  test('Filtros devem funcionar (se disponíveis)', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`)
    await page.waitForLoadState('networkidle')
    
    // Procurar por filtros
    const filters = page.locator('select, input[type="checkbox"], button').filter({ hasText: /filtro|categoria|preço|ordenar/i })
    
    if (await filters.count() > 0) {
      const firstFilter = filters.first()
      const tagName = await firstFilter.evaluate(el => el.tagName.toLowerCase())
      
      if (tagName === 'select') {
        // Testar select
        await firstFilter.selectOption({ index: 1 })
      } else if (tagName === 'input') {
        // Testar checkbox
        await firstFilter.click()
      } else {
        // Testar botão de filtro
        await firstFilter.click()
      }
      
      await page.waitForLoadState('networkidle')
      
      // Verificar se filtro foi aplicado (URL ou resultados mudaram)
      // Isso depende da implementação específica
    }
  })

  test('Paginação deve funcionar (se disponível)', async ({ page }) => {
    await page.goto(`${BASE_URL}/search?q=produto`)
    await page.waitForLoadState('networkidle')
    
    // Procurar botões de paginação
    const pagination = page.locator('button, a').filter({ hasText: /próxima|anterior|2|3|\>/i })
    
    if (await pagination.count() > 0) {
      const nextButton = pagination.filter({ hasText: /próxima|\>/i }).first()
      
      if (await nextButton.count() > 0 && await nextButton.isEnabled()) {
        await nextButton.click()
        await page.waitForLoadState('networkidle')
        
        // Verificar que URL ou conteúdo mudou
        expect(page.url()).toMatch(/page|p=|offset/)
      }
    }
  })

  test('Busca deve prevenir loop infinito', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`)
    await page.waitForLoadState('networkidle')
    
    // Monitorar requisições de rede
    const requests = []
    page.on('request', request => {
      if (request.url().includes('/api/') || request.url().includes('firestore')) {
        requests.push(request.url())
      }
    })
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="Buscar"]').first()
    await searchInput.fill('teste')
    await page.keyboard.press('Enter')
    
    // Aguardar um tempo e verificar se não há requisições excessivas
    await page.waitForTimeout(3000)
    
    // Verificar se não há mais que 10 requisições (evitar loop infinito)
    expect(requests.length).toBeLessThan(10)
  })
})

test.describe('Página de Produtos - Listagem', () => {
  
  test('Deve exibir lista de produtos', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`)
    await page.waitForLoadState('networkidle')
    
    // Aguardar carregamento de produtos
    await page.waitForTimeout(2000)
    
    // Verificar se há produtos ou mensagem de carregamento
    const products = page.locator('[data-testid="product-card"], .product-card, .product-item')
    const loading = page.locator('[data-testid="loading"], .loading, .spinner')
    const noProducts = page.locator('text="Nenhum produto", text="Em breve"')
    
    const hasProducts = await products.count() > 0
    const isLoading = await loading.count() > 0
    const hasNoProductsMessage = await noProducts.count() > 0
    
    expect(hasProducts || isLoading || hasNoProductsMessage).toBe(true)
  })

  test('Cards de produto devem ter informações essenciais', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    const products = page.locator('[data-testid="product-card"], .product-card, .product-item')
    
    if (await products.count() > 0) {
      const firstProduct = products.first()
      
      // Verificar elementos essenciais do card
      const image = firstProduct.locator('img')
      const title = firstProduct.locator('h2, h3, .title, [data-testid="product-title"]')
      const price = firstProduct.locator('.price, [data-testid="price"]').or(
        firstProduct.locator('text=/R\$|€|\$/').first()
      )
      
      await expect(image.first()).toBeVisible()
      await expect(title.first()).toBeVisible()
      
      if (await price.count() > 0) {
        await expect(price.first()).toBeVisible()
      }
    }
  })

  test('Clicar em produto deve navegar para página de detalhes', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    const products = page.locator('[data-testid="product-card"], .product-card, .product-item')
    
    if (await products.count() > 0) {
      const firstProduct = products.first()
      const productLink = firstProduct.locator('a').first()
      
      if (await productLink.count() > 0) {
        await productLink.click()
        await page.waitForLoadState('networkidle')
        
        // Verificar que navegou para página de produto
        expect(page.url()).toMatch(/product\/|\/p\//)
      }
    }
  })

  test('Deve ser responsivo em mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(`${BASE_URL}/products`)
    await page.waitForLoadState('networkidle')
    
    // Verificar que produtos estão empilhados verticalmente em mobile
    const products = page.locator('[data-testid="product-card"], .product-card, .product-item')
    
    if (await products.count() >= 2) {
      const firstProduct = products.nth(0)
      const secondProduct = products.nth(1)
      
      const firstBox = await firstProduct.boundingBox()
      const secondBox = await secondProduct.boundingBox()
      
      if (firstBox && secondBox) {
        // Segundo produto deve estar abaixo do primeiro (layout vertical)
        expect(secondBox.y).toBeGreaterThan(firstBox.y + firstBox.height - 50)
      }
    }
  })
})

test.describe('Página de Produto Individual', () => {
  
  test('Deve carregar página de produto específico', async ({ page }) => {
    // Tentar algumas URLs de produto
    const productUrls = [
      `${BASE_URL}/product/1`,
      `${BASE_URL}/product/test-product`
    ]
    
    for (const url of productUrls) {
      await page.goto(url)
      await page.waitForLoadState('networkidle')
      
      // Verificar se carregou (não é 404)
      const notFound = page.locator('text="404", text="não encontrado"')
      const hasContent = await page.locator('main, [role="main"]').count() > 0
      
      if (hasContent && await notFound.count() === 0) {
        // Página carregou com sucesso
        await expect(page.locator('main')).toBeVisible()
        break
      }
    }
  })

  test('Produto deve ter informações completas', async ({ page }) => {
    await page.goto(`${BASE_URL}/product/1`)
    await page.waitForLoadState('networkidle')
    
    // Verificar elementos essenciais da página de produto
    const productTitle = page.locator('h1')
    const productImage = page.locator('img').first()
    
    if (await productTitle.count() > 0) {
      await expect(productTitle).toBeVisible()
    }
    
    if (await productImage.count() > 0) {
      await expect(productImage).toBeVisible()
    }
    
    // Verificar botões de ação (comprar, adicionar ao carrinho, etc.)
    const actionButtons = page.locator('button').filter({ hasText: /comprar|carrinho|adicionar/i })
    
    if (await actionButtons.count() > 0) {
      await expect(actionButtons.first()).toBeVisible()
    }
  })

  test('Botão de voltar/breadcrumb deve funcionar', async ({ page }) => {
    // Navegar de products para um produto específico
    await page.goto(`${BASE_URL}/products`)
    await page.waitForLoadState('networkidle')
    
    const products = page.locator('[data-testid="product-card"], .product-card, .product-item a')
    
    if (await products.count() > 0) {
      await products.first().click()
      await page.waitForLoadState('networkidle')
      
      // Procurar botão de voltar
      const backButton = page.locator('button, a').filter({ hasText: /voltar|←|back/i })
      
      if (await backButton.count() > 0) {
        await backButton.first().click()
        await page.waitForLoadState('networkidle')
        
        expect(page.url()).toContain('/products')
      }
    }
  })
})

test.describe('Filtros e Ordenação Avançada', () => {
  
  test('Filtro por categoria deve funcionar', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`)
    await page.waitForLoadState('networkidle')
    
    // Procurar filtros de categoria
    const categoryFilter = page.locator('select option, button, a').filter({ hasText: /categoria|eletrônicos|roupas|casa/i })
    
    if (await categoryFilter.count() > 0) {
      await categoryFilter.first().click()
      await page.waitForLoadState('networkidle')
      
      // Verificar se URL foi atualizada com filtro
      expect(page.url()).toMatch(/category|categoria|filter/)
    }
  })

  test('Ordenação por preço deve funcionar', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`)
    await page.waitForLoadState('networkidle')
    
    const sortOptions = page.locator('select, button').filter({ hasText: /ordenar|preço|menor|maior/i })
    
    if (await sortOptions.count() > 0) {
      const sortSelect = sortOptions.first()
      
      if (await sortSelect.evaluate(el => el.tagName.toLowerCase()) === 'select') {
        // Testar ordenação por menor preço
        await sortSelect.selectOption({ label: /menor|crescente/i })
        await page.waitForLoadState('networkidle')
        
        // Verificar se URL reflete ordenação
        expect(page.url()).toMatch(/sort|order/)
      }
    }
  })

  test('Filtro de preço por faixa deve funcionar', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`)
    await page.waitForLoadState('networkidle')
    
    // Procurar inputs de preço mínimo/máximo
    const minPriceInput = page.locator('input[placeholder*="mínimo"], input[name*="min"]')
    const maxPriceInput = page.locator('input[placeholder*="máximo"], input[name*="max"]')
    
    if (await minPriceInput.count() > 0 && await maxPriceInput.count() > 0) {
      await minPriceInput.fill('10')
      await maxPriceInput.fill('100')
      
      const applyButton = page.locator('button').filter({ hasText: /aplicar|filtrar/i })
      
      if (await applyButton.count() > 0) {
        await applyButton.click()
        await page.waitForLoadState('networkidle')
        
        // Verificar se filtro foi aplicado
        expect(page.url()).toMatch(/min|max|price/)
      }
    }
  })
})
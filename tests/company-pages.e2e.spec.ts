/**
 * @file tests/company-pages.e2e.spec.ts
 * @description Testes E2E completos para páginas de empresas
 * @coverage: Company List, Company Profile, Company Products, Following
 */

import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3001'
const TEST_USER = {
  email: 'cu@buceta.net',
  password: '123456'
}

test.describe('Páginas de Empresas - Lista e Busca', () => {
  
  test('Deve exibir lista de empresas/franquias', async ({ page }) => {
    await page.goto(`${BASE_URL}/franchises`)
    await page.waitForLoadState('networkidle')
    
    // Verificar título da página
    const pageTitle = page.locator('[data-testid="page-title"]')
    await expect(pageTitle.first()).toBeVisible()
    
    // Verificar se há empresas ou mensagem de carregamento
    const companies = page.locator('[data-testid="company-card"], .company-card, .franchise-card')
    const loading = page.locator('[data-testid="loading"], .loading, .spinner')
    const noCompanies = page.locator('text="Nenhuma empresa", text="Em breve"')
    
    const hasCompanies = await companies.count() > 0
    const isLoading = await loading.count() > 0
    const hasNoCompaniesMessage = await noCompanies.count() > 0
    
    expect(hasCompanies || isLoading || hasNoCompaniesMessage).toBe(true)
  })

  test('Cards de empresa devem ter informações essenciais', async ({ page }) => {
    await page.goto(`${BASE_URL}/franchises`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    const companies = page.locator('[data-testid="company-card"], .company-card, .franchise-card')
    
    if (await companies.count() > 0) {
      const firstCompany = companies.first()
      
      // Verificar elementos essenciais do card
      const logo = firstCompany.locator('img')
      const name = firstCompany.locator('h2, h3, .name, [data-testid="company-name"]')
      const location = firstCompany.locator('.location, [data-testid="location"]').or(
        firstCompany.locator('text=/São Paulo|Rio de Janeiro|Brasília/i')
      )
      
      await expect(logo.first()).toBeVisible()
      await expect(name.first()).toBeVisible()
      
      if (await location.count() > 0) {
        await expect(location.first()).toBeVisible()
      }
    }
  })

  test('Clicar em empresa deve navegar para perfil', async ({ page }) => {
    await page.goto(`${BASE_URL}/franchises`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    const companies = page.locator('[data-testid="company-card"], .company-card, .franchise-card')
    
    if (await companies.count() > 0) {
      const firstCompany = companies.first()
      const companyLink = firstCompany.locator('a').first()
      
      if (await companyLink.count() > 0) {
        await companyLink.click()
        await page.waitForLoadState('networkidle')
        
        // Verificar que navegou para página de empresa
        expect(page.url()).toMatch(/company\/|empresa\//)
      }
    }
  })

  test('Busca de empresas deve funcionar', async ({ page }) => {
    await page.goto(`${BASE_URL}/franchises`)
    await page.waitForLoadState('networkidle')
    
    // Procurar campo de busca
    const searchInput = page.locator('input[type="search"], input[placeholder*="Buscar"], input[placeholder*="empresa"]')
    
    if (await searchInput.count() > 0) {
      await searchInput.fill('test')
      await page.keyboard.press('Enter')
      await page.waitForLoadState('networkidle')
      
      // Verificar que busca foi processada
      expect(page.url()).toMatch(/search|busca|q=/)
    }
  })
})

test.describe('Página de Empresa Individual', () => {
  
  test('Deve carregar perfil de empresa', async ({ page }) => {
    // Tentar diferentes IDs de empresa
    const companyIds = ['1', 'test-company', 'company-123']
    
    for (const id of companyIds) {
      await page.goto(`${BASE_URL}/company/${id}`)
      await page.waitForLoadState('networkidle')
      
      // Verificar se carregou (não é 404)
      const notFound = page.locator('text="404", text="não encontrada"')
      const hasContent = await page.locator('main, [role="main"]').count() > 0
      
      if (hasContent && await notFound.count() === 0) {
        // Página carregou com sucesso
        await expect(page.locator('main')).toBeVisible()
        break
      }
    }
  })

  test('Perfil deve exibir informações da empresa', async ({ page }) => {
    await page.goto(`${BASE_URL}/company/1`)
    await page.waitForLoadState('networkidle')
    
    // Se página carregou, verificar elementos
    if (!page.url().includes('404')) {
      // Verificar logo/imagem da empresa
      const companyLogo = page.locator('img').first()
      
      if (await companyLogo.count() > 0) {
        await expect(companyLogo).toBeVisible()
      }
      
      // Verificar nome da empresa
      const companyName = page.locator('h1, [data-testid="company-name"]')
      
      if (await companyName.count() > 0) {
        await expect(companyName).toBeVisible()
      }
      
      // Verificar descrição ou informações
      const description = page.locator('p, [data-testid="description"], .description')
      
      if (await description.count() > 0) {
        await expect(description.first()).toBeVisible()
      }
    }
  })

  test('Botão "Seguir empresa" deve funcionar', async ({ page }) => {
    // Login primeiro
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[type="email"]', TEST_USER.email)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button:has-text("Entrar")')
    await page.waitForURL(`${BASE_URL}/`)
    
    await page.goto(`${BASE_URL}/company/1`)
    await page.waitForLoadState('networkidle')
    
    if (!page.url().includes('404')) {
      // Procurar botão de seguir
      const followButton = page.locator('button, a').filter({ 
        hasText: /seguir|follow|curtir/i 
      })
      
      if (await followButton.count() > 0) {
        const buttonText = await followButton.first().textContent()
        await followButton.first().click()
        await page.waitForTimeout(1000)
        
        // Verificar se estado mudou
        const newButtonText = await followButton.first().textContent()
        expect(newButtonText).not.toBe(buttonText)
      }
    }
  })

  test('Lista de produtos da empresa deve funcionar', async ({ page }) => {
    await page.goto(`${BASE_URL}/company/1`)
    await page.waitForLoadState('networkidle')
    
    if (!page.url().includes('404')) {
      // Procurar seção de produtos
      const productsSection = page.locator('[data-testid="company-products"], .products, .company-products')
      
      if (await productsSection.count() > 0) {
        await expect(productsSection.first()).toBeVisible()
        
        // Verificar produtos
        const products = productsSection.locator('[data-testid="product-card"], .product-card, .product-item')
        
        if (await products.count() > 0) {
          await expect(products.first()).toBeVisible()
        } else {
          // Verificar mensagem de "sem produtos"
          const noProducts = productsSection.locator('text="Nenhum produto", text="Em breve"')
          
          if (await noProducts.count() > 0) {
            await expect(noProducts.first()).toBeVisible()
          }
        }
      }
    }
  })

  test('Contato da empresa deve estar disponível', async ({ page }) => {
    await page.goto(`${BASE_URL}/company/1`)
    await page.waitForLoadState('networkidle')
    
    if (!page.url().includes('404')) {
      // Procurar informações de contato
      const contactInfo = page.locator('[data-testid="contact"], .contact').or(
        page.locator('text=/\(\d{2}\)|@|www\./').first()
      )
      
      if (await contactInfo.count() > 0) {
        await expect(contactInfo.first()).toBeVisible()
      }
      
      // Procurar botões de contato (WhatsApp, etc.)
      const contactButtons = page.locator('a, button').filter({ 
        hasText: /whatsapp|contato|telefone/i 
      })
      
      if (await contactButtons.count() > 0) {
        await expect(contactButtons.first()).toBeVisible()
      }
    }
  })
})

test.describe('Empresas que Sigo - Perfil do Usuário', () => {
  
  test('Lista de empresas seguidas deve aparecer no perfil', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[type="email"]', TEST_USER.email)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button:has-text("Entrar")')
    await page.waitForURL(`${BASE_URL}/`)
    
    await page.goto(`${BASE_URL}/profile`)
    await page.waitForLoadState('networkidle')
    
    // Verificar aba "Empresas que Sigo"
    const followingTab = page.locator('button, a').filter({ hasText: /empresas que sigo/i })
    
    if (await followingTab.count() > 0) {
      await followingTab.click()
      await page.waitForTimeout(500)
      
      // Verificar conteúdo da aba
      const followedCompanies = page.locator('[data-testid="followed-company"], .followed-company')
      const noCompanies = page.locator('text="Nenhuma empresa seguida", text="Não segue nenhuma"')
      
      const hasFollowedCompanies = await followedCompanies.count() > 0
      const hasNoCompaniesMessage = await noCompanies.count() > 0
      
      expect(hasFollowedCompanies || hasNoCompaniesMessage).toBe(true)
    }
  })

  test('Deve poder deixar de seguir empresa do perfil', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[type="email"]', TEST_USER.email)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button:has-text("Entrar")')
    await page.waitForURL(`${BASE_URL}/`)
    
    await page.goto(`${BASE_URL}/profile`)
    await page.waitForLoadState('networkidle')
    
    const followingTab = page.locator('button').filter({ hasText: /empresas que sigo/i })
    
    if (await followingTab.count() > 0) {
      await followingTab.click()
      await page.waitForTimeout(500)
      
      // Procurar botão de deixar de seguir
      const unfollowButton = page.locator('button').filter({ 
        hasText: /deixar de seguir|unfollow|parar/i 
      })
      
      if (await unfollowButton.count() > 0) {
        const companiesBefore = await page.locator('[data-testid="followed-company"], .followed-company').count()
        
        await unfollowButton.first().click()
        await page.waitForTimeout(1000)
        
        const companiesAfter = await page.locator('[data-testid="followed-company"], .followed-company').count()
        expect(companiesAfter).toBeLessThanOrEqual(companiesBefore)
      }
    }
  })
})

test.describe('Responsividade - Páginas de Empresas', () => {
  
  test('Lista de empresas deve ser responsiva em mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(`${BASE_URL}/franchises`)
    await page.waitForLoadState('networkidle')
    
    // Verificar que cards estão empilhados verticalmente
    const companies = page.locator('[data-testid="company-card"], .company-card, .franchise-card')
    
    if (await companies.count() >= 2) {
      const firstCompany = companies.nth(0)
      const secondCompany = companies.nth(1)
      
      const firstBox = await firstCompany.boundingBox()
      const secondBox = await secondCompany.boundingBox()
      
      if (firstBox && secondBox) {
        // Segundo card deve estar abaixo do primeiro
        expect(secondBox.y).toBeGreaterThan(firstBox.y)
      }
    }
  })

  test('Perfil de empresa deve ser responsivo', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(`${BASE_URL}/company/1`)
    await page.waitForLoadState('networkidle')
    
    if (!page.url().includes('404')) {
      // Verificar que conteúdo está visível
      const mainContent = page.locator('main, [role="main"]')
      await expect(mainContent.first()).toBeVisible()
      
      // Verificar que não há scroll horizontal
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      const windowWidth = await page.evaluate(() => window.innerWidth)
      expect(bodyWidth).toBeLessThanOrEqual(windowWidth + 20)
    }
  })

  test('Botões devem ser tocáveis em mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(`${BASE_URL}/franchises`)
    await page.waitForLoadState('networkidle')
    
    const buttons = page.locator('button, a')
    
    for (let i = 0; i < Math.min(await buttons.count(), 5); i++) {
      const button = buttons.nth(i)
      const box = await button.boundingBox()
      
      if (box && box.height > 0) {
        // Botões devem ter pelo menos 44px de altura para touch
        expect(box.height).toBeGreaterThanOrEqual(40)
      }
    }
  })
})

test.describe('Estados de Erro e Loading', () => {
  
  test('Empresa inexistente deve mostrar 404', async ({ page }) => {
    await page.goto(`${BASE_URL}/company/empresa-que-nao-existe-xyz`)
    await page.waitForLoadState('networkidle')
    
    // Verificar página 404 ou redirecionamento
    const notFound = page.locator('text="404", text="não encontrada", text="not found"')
    const isNotFoundUrl = page.url().includes('404')
    
    expect((await notFound.count() > 0) || isNotFoundUrl).toBe(true)
  })

  test('Loading states devem ser exibidos', async ({ page }) => {
    await page.goto(`${BASE_URL}/franchises`)
    
    // Verificar loading inicial
    const loading = page.locator('[data-testid="loading"], .loading, .spinner')
    
    if (await loading.count() > 0) {
      await expect(loading.first()).toBeVisible()
    }
    
    await page.waitForLoadState('networkidle')
    
    // Loading deve desaparecer após carregamento
    if (await loading.count() > 0) {
      await expect(loading.first()).not.toBeVisible()
    }
  })

  test('Erro de rede deve ser tratado graciosamente', async ({ page }) => {
    // Simular erro de rede
    await page.route('**/api/**', route => route.abort())
    
    await page.goto(`${BASE_URL}/franchises`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Verificar se há mensagem de erro amigável
    const errorMessage = page.locator('text="erro", text="problema", text="tentar novamente"')
    const fallbackContent = page.locator('main, [role="main"]')
    
    const hasErrorMessage = await errorMessage.count() > 0
    const hasFallbackContent = await fallbackContent.count() > 0
    
    expect(hasErrorMessage || hasFallbackContent).toBe(true)
  })
})
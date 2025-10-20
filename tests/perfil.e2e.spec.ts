/**
 * @file tests/perfil.e2e.spec.ts
 * @description Testes E2E para a página de perfil do usuário
 * @tools Playwright
 */

import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3000'

test.describe('Página de Perfil do Usuário', () => {
  test('Deve redirecionar usuário não autenticado para login', async ({ page }) => {
    // Acessar perfil sem estar logado
    await page.goto(`${BASE_URL}/perfil`)
    
    // Aguardar redirecionamento
    await page.waitForURL(/.*login.*/, { timeout: 5000 })
    
    // Verificar que está na página de login
    expect(page.url()).toContain('/login')
    expect(page.url()).toContain('returnUrl=%2Fperfil')
    
    // Verificar que existe o formulário de login
    const emailInput = page.locator('input[placeholder*="email"]')
    await expect(emailInput).toBeVisible()
  })

  test('Deve exibir dados do usuário logado', async ({ page, context }) => {
    // Simular login (usar dados de teste ou mock)
    await page.goto(`${BASE_URL}/login`)
    
    // Preencher login
    await page.fill('input[placeholder*="email"]', 'cu@buceta.net')
    await page.fill('input[placeholder*="Senha"]', '123456')
    await page.click('button:has-text("Entrar")')
    
    // Aguardar redirecionamento para home
    await page.waitForURL(`${BASE_URL}/`, { timeout: 5000 })
    
    // Navegar para perfil
    await page.goto(`${BASE_URL}/perfil`)
    
    // Aguardar carregamento
    await page.waitForLoadState('networkidle')
    
    // Verificar que o perfil está carregado
    const profileHeader = page.locator('h1:has-text("Tobias")')
    await expect(profileHeader).toBeVisible()
    
    // Verificar informações
    await expect(page.locator('text=cu@buceta.net')).toBeVisible()
    await expect(page.locator('text=61983382778')).toBeVisible()
    await expect(page.locator('text=Armando Penca')).toBeVisible()
  })

  test('Deve exibir avatar com iniciais', async ({ page }) => {
    // Login primeiro
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[placeholder*="email"]', 'cu@buceta.net')
    await page.fill('input[placeholder*="Senha"]', '123456')
    await page.click('button:has-text("Entrar")')
    await page.waitForURL(`${BASE_URL}/`)
    
    // Ir para perfil
    await page.goto(`${BASE_URL}/perfil`)
    await page.waitForLoadState('networkidle')
    
    // Verificar avatar (deve conter letra ou imagem)
    const avatar = page.locator('div.rounded-full.bg-gradient-to-br')
    await expect(avatar).toBeVisible()
  })

  test('Deve exibir badges de status', async ({ page }) => {
    // Login e ir para perfil
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[placeholder*="email"]', 'cu@buceta.net')
    await page.fill('input[placeholder*="Senha"]', '123456')
    await page.click('button:has-text("Entrar")')
    await page.waitForURL(`${BASE_URL}/`)
    
    await page.goto(`${BASE_URL}/perfil`)
    await page.waitForLoadState('networkidle')
    
    // Verificar badges
    const badges = page.locator('[class*="rounded-full"]')
    const badgeTexts = await badges.allTextContents()
    
    // Deve conter pelo menos um badge (Empreendedor ou Ativo)
    expect(badgeTexts.join(' ')).toMatch(/Empreendedor|Ativo|Afiliado/)
  })

  test('Deve navegar entre abas', async ({ page }) => {
    // Setup
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[placeholder*="email"]', 'cu@buceta.net')
    await page.fill('input[placeholder*="Senha"]', '123456')
    await page.click('button:has-text("Entrar")')
    await page.waitForURL(`${BASE_URL}/`)
    
    await page.goto(`${BASE_URL}/perfil`)
    await page.waitForLoadState('networkidle')
    
    // Verificar aba inicial (Empresas que Sigo)
    const tab1 = page.locator('button:has-text("Empresas que Sigo")')
    await expect(tab1).toHaveClass(/active/)
    await expect(page.locator('text=Nenhuma empresa seguida')).toBeVisible()
    
    // Clicar em aba 2
    const tab2 = page.locator('button:has-text("Produtos de Interesse")')
    await tab2.click()
    
    // Verificar conteúdo mudou
    await expect(page.locator('text=Nenhum produto salvo')).toBeVisible()
    
    // Clicar em aba 3
    const tab3 = page.locator('button:has-text("Minha Afiliação")')
    await tab3.click()
    
    // Verificar conteúdo mudou
    await expect(page.locator('text=Nenhuma afiliação ativa')).toBeVisible()
  })

  test('Botão "Cadastrar Empresa" deve apontar para URL correta', async ({ page, context }) => {
    // Setup
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[placeholder*="email"]', 'cu@buceta.net')
    await page.fill('input[placeholder*="Senha"]', '123456')
    await page.click('button:has-text("Entrar")')
    await page.waitForURL(`${BASE_URL}/`)
    
    await page.goto(`${BASE_URL}/perfil`)
    await page.waitForLoadState('networkidle')
    
    // Verificar link do botão
    const botao = page.locator('a:has-text("Cadastrar Empresa")')
    await expect(botao).toHaveAttribute(
      'href',
      'https://franquia.xeco.com.br/create-company'
    )
    await expect(botao).toHaveAttribute('target', '_blank')
    await expect(botao).toHaveAttribute('rel', 'noopener noreferrer')
  })

  test('Deve exibir endereço completo', async ({ page }) => {
    // Setup
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[placeholder*="email"]', 'cu@buceta.net')
    await page.fill('input[placeholder*="Senha"]', '123456')
    await page.click('button:has-text("Entrar")')
    await page.waitForURL(`${BASE_URL}/`)
    
    await page.goto(`${BASE_URL}/perfil`)
    await page.waitForLoadState('networkidle')
    
    // Verificar endereço
    const endereco = page.locator('text=/Armando Penca.*Centro.*Corrente.*PI/')
    await expect(endereco).toBeVisible()
  })

  test('Ícone de perfil deve aparecer no header', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[placeholder*="email"]', 'cu@buceta.net')
    await page.fill('input[placeholder*="Senha"]', '123456')
    await page.click('button:has-text("Entrar")')
    await page.waitForURL(`${BASE_URL}/`)
    
    // Verificar header
    const perfilIcon = page.locator('a[href="/perfil"]').first()
    await expect(perfilIcon).toBeVisible()
    
    // Clicar no ícone de perfil
    await perfilIcon.click()
    
    // Deve navegar para perfil
    await expect(page).toHaveURL(`${BASE_URL}/perfil`)
  })

  test('Página deve ser responsiva em mobile', async ({ page }) => {
    // Configurar viewport mobile
    await page.setViewportSize({ width: 375, height: 812 })
    
    // Setup
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[placeholder*="email"]', 'cu@buceta.net')
    await page.fill('input[placeholder*="Senha"]', '123456')
    await page.click('button:has-text("Entrar")')
    await page.waitForURL(`${BASE_URL}/`)
    
    await page.goto(`${BASE_URL}/perfil`)
    await page.waitForLoadState('networkidle')
    
    // Verificar que todos os elementos estão visíveis
    const avatar = page.locator('div.rounded-full.bg-gradient-to-br')
    await expect(avatar).toBeVisible()
    
    const nome = page.locator('h1')
    await expect(nome).toBeVisible()
    
    const abas = page.locator('button[role="button"]')
    await expect(abas).toHaveCount(3)
    
    // Verificar scroll não quebra layout
    await page.evaluate(() => window.scrollBy(0, 500))
    const conteudo = page.locator('text=Nenhuma empresa seguida')
    await expect(conteudo).toBeVisible()
  })

  test('Página deve ser responsiva em desktop', async ({ page }) => {
    // Configurar viewport desktop
    await page.setViewportSize({ width: 1280, height: 720 })
    
    // Setup
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[placeholder*="email"]', 'cu@buceta.net')
    await page.fill('input[placeholder*="Senha"]', '123456')
    await page.click('button:has-text("Entrar")')
    await page.waitForURL(`${BASE_URL}/`)
    
    await page.goto(`${BASE_URL}/perfil`)
    await page.waitForLoadState('networkidle')
    
    // Verificar layout desktop
    const container = page.locator('div[class*="max-w-4xl"]')
    await expect(container).toBeVisible()
    
    // Verificar que conteúdo está alinhado corretamente
    const perfil = page.locator('text=Tobias')
    const abas = page.locator('button:has-text("Empresas que Sigo")')
    
    const perfilBox = await perfil.boundingBox()
    const abasBox = await abas.boundingBox()
    
    // Abas devem estar abaixo do perfil
    expect(abasBox?.y).toBeGreaterThan(perfilBox?.y ?? 0)
  })

  test('Deve carregar dados sem erros de console', async ({ page }) => {
    const consoleErrors: string[] = []
    
    // Capturar erros de console
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    // Setup
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[placeholder*="email"]', 'cu@buceta.net')
    await page.fill('input[placeholder*="Senha"]', '123456')
    await page.click('button:has-text("Entrar")')
    await page.waitForURL(`${BASE_URL}/`)
    
    await page.goto(`${BASE_URL}/perfil`)
    await page.waitForLoadState('networkidle')
    
    // Não deve ter erros de TypeScript ou JS críticos
    const criticalErrors = consoleErrors.filter(
      err => !err.includes('analytics') && !err.includes('Permission denied')
    )
    
    expect(criticalErrors).toHaveLength(0)
  })
})

// Testes de performance
test.describe('Performance da Página de Perfil', () => {
  test('Deve carregar em menos de 3 segundos', async ({ page }) => {
    const startTime = Date.now()
    
    // Setup
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[placeholder*="email"]', 'cu@buceta.net')
    await page.fill('input[placeholder*="Senha"]', '123456')
    await page.click('button:has-text("Entrar")')
    await page.waitForURL(`${BASE_URL}/`)
    
    // Navegar para perfil
    const perfil_start = Date.now()
    await page.goto(`${BASE_URL}/perfil`)
    await page.waitForLoadState('networkidle')
    const perfil_end = Date.now()
    
    const loadTime = perfil_end - perfil_start
    
    expect(loadTime).toBeLessThan(3000)
  })

  test('Deve renderizar sem layout shift', async ({ page }) => {
    // Setup
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[placeholder*="email"]', 'cu@buceta.net')
    await page.fill('input[placeholder*="Senha"]', '123456')
    await page.click('button:has-text("Entrar")')
    await page.waitForURL(`${BASE_URL}/`)
    
    await page.goto(`${BASE_URL}/perfil`)
    
    // Verificar que elementos não se movem após carregamento
    const avatar = page.locator('div.rounded-full.bg-gradient-to-br').first()
    const avatarBox1 = await avatar.boundingBox()
    
    await page.waitForLoadState('networkidle')
    const avatarBox2 = await avatar.boundingBox()
    
    // Avatar deve estar no mesmo lugar
    expect(avatarBox1?.x).toBe(avatarBox2?.x)
    expect(avatarBox1?.y).toBe(avatarBox2?.y)
  })
})

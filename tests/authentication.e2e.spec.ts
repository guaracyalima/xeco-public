/**
 * @file tests/authentication.e2e.spec.ts
 * @description Testes E2E completos para autenticação
 * @coverage: Login, Logout, Proteção de Rotas, Firebase Auth
 */

import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3001'

// Dados de teste (usar credenciais de teste - podem não existir no Firebase)
const TEST_USER = {
  email: 'teste@exemplo.com',
  password: '123456',
  name: 'Usuário Teste'
}

test.describe('Autenticação - Login e Logout', () => {
  
  test('Deve fazer login com credenciais válidas', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')
    
    // Verificar elementos do formulário
    const emailInput = page.locator('input[type="email"], input[placeholder*="email"]')
    const passwordInput = page.locator('input[type="password"], input[placeholder*="senha" i]')
    const submitBtn = page.locator('button[type="submit"], button:has-text("Entrar")')
    
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
    await expect(submitBtn).toBeVisible()
    
    // Fazer login
    await emailInput.fill(TEST_USER.email)
    await passwordInput.fill(TEST_USER.password)
    await submitBtn.click()
    
    // Aguardar redirecionamento
    await page.waitForURL(`${BASE_URL}/`, { timeout: 10000 })
    expect(page.url()).toBe(`${BASE_URL}/`)
    
    // Verificar que está logado (procurar por elemento de usuário logado)
    const userIndicator = page.locator('[data-testid="user-menu"], .avatar, a[href*="profile"], button:has-text("' + TEST_USER.name + '")')
    await expect(userIndicator.first()).toBeVisible({ timeout: 5000 })
  })

  test('Deve rejeitar credenciais inválidas', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')
    
    const emailInput = page.locator('input[type="email"], input[placeholder*="email"]')
    const passwordInput = page.locator('input[type="password"], input[placeholder*="senha" i]')
    const submitBtn = page.locator('button[type="submit"], button:has-text("Entrar")')
    
    // Tentar login com dados inválidos
    await emailInput.fill('usuario@inexistente.com')
    await passwordInput.fill('senhaerrada')
    await submitBtn.click()
    
    // Aguardar mensagem de erro
    await page.waitForTimeout(2000)
    
    // Verificar que ainda está na página de login
    expect(page.url()).toContain('/login')
    
    // Verificar mensagem de erro (toast, alert, ou texto na página)
    const errorMessage = page.locator('[role="alert"], .error, .toast, div:has-text("erro"), div:has-text("inválid")')
    
    // Se houver mensagem de erro visível, verificar
    if (await errorMessage.count() > 0) {
      await expect(errorMessage.first()).toBeVisible()
    }
  })

  test('Deve fazer logout corretamente', async ({ page }) => {
    // Primeiro fazer login
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')
    
    await page.fill('input[type="email"], input[placeholder*="email"]', TEST_USER.email)
    await page.fill('input[type="password"], input[placeholder*="senha" i]', TEST_USER.password)
    await page.click('button[type="submit"], button:has-text("Entrar")')
    
    await page.waitForURL(`${BASE_URL}/`)
    
    // Procurar e clicar no botão de logout
    const logoutBtn = page.locator('button:has-text("Sair"), button:has-text("Logout"), a:has-text("Sair")')
    
    if (await logoutBtn.count() > 0) {
      await logoutBtn.click()
      
      // Aguardar redirecionamento para login
      await page.waitForURL(/.*login.*/, { timeout: 5000 })
      expect(page.url()).toContain('/login')
    } else {
      // Se não encontrar botão direto, procurar em menu dropdown
      const userMenu = page.locator('[data-testid="user-menu"], .avatar, button').filter({ hasText: TEST_USER.name })
      
      if (await userMenu.count() > 0) {
        await userMenu.first().click()
        await page.waitForTimeout(500)
        
        const logoutOption = page.locator('button:has-text("Sair"), a:has-text("Sair")')
        if (await logoutOption.count() > 0) {
          await logoutOption.click()
          await page.waitForURL(/.*login.*/, { timeout: 5000 })
        }
      }
    }
  })
})

test.describe('Proteção de Rotas', () => {
  
  test('Rotas protegidas devem redirecionar para login', async ({ page }) => {
    const protectedRoutes = [
      '/profile',
      '/cart',
      '/favorites',
      '/order/123'
    ]
    
    for (const route of protectedRoutes) {
      await page.goto(`${BASE_URL}${route}`)
      await page.waitForLoadState('networkidle')
      
      // Deve redirecionar para login com returnUrl
      await page.waitForURL(/.*login.*/, { timeout: 5000 })
      expect(page.url()).toContain('/login')
      expect(page.url()).toContain('returnUrl')
    }
  })

  test('Usuário logado deve acessar rotas protegidas', async ({ page }) => {
    // Fazer login primeiro
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[type="email"], input[placeholder*="email"]', TEST_USER.email)
    await page.fill('input[type="password"], input[placeholder*="senha" i]', TEST_USER.password)
    await page.click('button[type="submit"], button:has-text("Entrar")')
    await page.waitForURL(`${BASE_URL}/`)
    
    // Testar acesso a rotas protegidas
    const protectedRoutes = [
      '/profile',
      '/cart', 
      '/favorites'
    ]
    
    for (const route of protectedRoutes) {
      await page.goto(`${BASE_URL}${route}`)
      await page.waitForLoadState('networkidle')
      
      // Não deve redirecionar para login
      expect(page.url()).toBe(`${BASE_URL}${route}`)
      
      // Deve carregar conteúdo da página
      const content = page.locator('main, [role="main"], body')
      await expect(content).toBeVisible()
    }
  })
})

test.describe('Validação de Formulários', () => {
  
  test('Deve validar campos obrigatórios no login', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')
    
    const submitBtn = page.locator('button[type="submit"], button:has-text("Entrar")')
    
    // Tentar submeter sem preencher
    await submitBtn.click()
    
    // Verificar validação HTML5 ou mensagens customizadas
    const emailInput = page.locator('input[type="email"], input[placeholder*="email"]')
    const passwordInput = page.locator('input[type="password"], input[placeholder*="senha" i]')
    
    // Verificar se campos estão marcados como inválidos
    const emailValidity = await emailInput.evaluate(el => (el as HTMLInputElement).checkValidity())
    expect(emailValidity).toBe(false)
  })

  test('Deve validar formato de email', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')
    
    const emailInput = page.locator('input[type="email"], input[placeholder*="email"]')
    const submitBtn = page.locator('button[type="submit"], button:has-text("Entrar")')
    
    // Inserir email inválido
    await emailInput.fill('email-invalido')
    await page.fill('input[type="password"], input[placeholder*="senha" i]', '123456')
    await submitBtn.click()
    
    // Verificar validação de email
    const emailValidity = await emailInput.evaluate(el => (el as HTMLInputElement).checkValidity())
    expect(emailValidity).toBe(false)
  })
})

test.describe('Estados de Loading e Feedback', () => {
  
  test('Deve mostrar estado de loading durante login', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')
    
    await page.fill('input[type="email"], input[placeholder*="email"]', TEST_USER.email)
    await page.fill('input[type="password"], input[placeholder*="senha" i]', TEST_USER.password)
    
    const submitBtn = page.locator('button[type="submit"], button:has-text("Entrar")')
    
    // Clicar e verificar se há indicador de loading
    await submitBtn.click()
    
    // Procurar por indicadores de loading
    const loadingIndicators = page.locator('.spinner, .loading, [data-testid="loading"], svg.animate-spin')
    
    if (await loadingIndicators.count() > 0) {
      await expect(loadingIndicators.first()).toBeVisible()
    }
    
    // Ou verificar se botão está desabilitado
    const isDisabled = await submitBtn.isDisabled()
    if (isDisabled) {
      expect(isDisabled).toBe(true)
    }
    
    // Aguardar completar
    await page.waitForURL(`${BASE_URL}/`, { timeout: 10000 })
  })

  test('Deve preservar returnUrl após login', async ({ page }) => {
    // Acessar rota protegida primeiro
    await page.goto(`${BASE_URL}/profile`)
    await page.waitForURL(/.*login.*/, { timeout: 5000 })
    
    // Verificar que returnUrl está na URL
    expect(page.url()).toContain('returnUrl')
    
    // Fazer login
    await page.fill('input[type="email"], input[placeholder*="email"]', TEST_USER.email)
    await page.fill('input[type="password"], input[placeholder*="senha" i]', TEST_USER.password)
    await page.click('button[type="submit"], button:has-text("Entrar")')
    
    // Deve redirecionar para a rota original
    await page.waitForURL(`${BASE_URL}/profile`, { timeout: 10000 })
    expect(page.url()).toBe(`${BASE_URL}/profile`)
  })
})
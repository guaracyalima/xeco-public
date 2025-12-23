/**
 * @file tests/smoke.e2e.spec.ts
 * @description Smoke tests básicos para verificar se o servidor está funcionando
 */

import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3001'

test.describe('Smoke Tests', () => {
  
  test('Servidor deve responder na homepage', async ({ page }) => {
    await page.goto(BASE_URL)
    
    // Aguardar que a página carregue
    await page.waitForLoadState('domcontentloaded')
    
    // Verificar se o título da página existe
    const title = await page.title()
    expect(title).toBeTruthy()
    
    // Verificar se o HTML principal carregou
    const body = await page.locator('body')
    await expect(body).toBeVisible()
  })

  test('Homepage deve ter conteúdo básico', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('domcontentloaded')
    
    // Verificar se existe algum elemento principal
    const mainElements = page.locator('main, .container, #root, [data-testid], h1, h2')
    await expect(mainElements.first()).toBeVisible({ timeout: 5000 })
  })

  test('Página deve carregar recursos CSS/JS', async ({ page }) => {
    const responses: string[] = []
    
    // Capturar respostas de recursos
    page.on('response', response => {
      if (response.status() < 400) {
        responses.push(response.url())
      }
    })
    
    await page.goto(BASE_URL)
    await page.waitForLoadState('domcontentloaded')
    
    // Verificar se pelo menos alguns recursos carregaram
    expect(responses.length).toBeGreaterThan(0)
    
    // Verificar se a página principal respondeu com sucesso
    const htmlResponse = responses.find(url => url === BASE_URL || url.endsWith('/'))
    expect(htmlResponse).toBeTruthy()
  })

})
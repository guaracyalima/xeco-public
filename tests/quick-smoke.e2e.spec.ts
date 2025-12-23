/**
 * @file tests/quick-smoke.e2e.spec.ts
 * @description Testes rápidos de fumaça - apenas 2 testes essenciais
 */

import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3001'

test.describe('Quick Smoke Tests', () => {
  
  test('Homepage carrega', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('domcontentloaded')
    
    const title = await page.title()
    expect(title).toBeTruthy()
    
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('Login page existe', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('domcontentloaded')
    
    // Deve ter um formulário ou pelo menos não dar 404
    const notFound = page.locator('text=/404|Not Found|Página não encontrada/i')
    await expect(notFound).not.toBeVisible()
  })

})
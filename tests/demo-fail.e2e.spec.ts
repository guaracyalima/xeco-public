/**
 * @file tests/demo-fail.e2e.spec.ts
 * @description Demo de teste que falha para mostrar análise de IA
 */

import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3001'

test.describe('Demo Failures', () => {
  
  test('Elemento inexistente (demo)', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('domcontentloaded')
    
    // Este teste vai falhar de propósito
    const fakeElement = page.locator('[data-testid="elemento-que-nao-existe"]')
    await expect(fakeElement).toBeVisible({ timeout: 2000 })
  })

})
import { test, expect } from '@playwright/test';
import { mockLogin } from './helpers.js';

test.describe('facilitator round smoke', () => {
  test('login facilitator, open round, see declarations', async ({ page }) => {
    await mockLogin(page, 'facilitador@demo.ember');

    await page.goto('/facilitator');
    await expect(page.getByRole('heading', { name: /painel do facilitador/i })).toBeVisible();

    await page.getByRole('tab', { name: /novo convite/i }).click();
    await page.getByRole('button', { name: /abrir inscrições/i }).click();

    await expect(page.getByText(/inscrições abertas/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/presenças confirmadas/i)).toBeVisible({ timeout: 10_000 });
  });
});

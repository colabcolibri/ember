import { test, expect } from '@playwright/test';
import { mockLogin, pickPlace } from './helpers.js';

test.describe('onboarding smoke', () => {
  test('login, complete profile, declare presence', async ({ page }) => {
    await mockLogin(page, 'novo@demo.ember');

    await expect(page.getByText(/complete seu perfil/i)).toBeVisible();

    await page.goto('/profile');
    await page.locator('#displayName').fill('Membro Novo');
    await page.locator('#editionYear').fill('2024');

    await pickPlace(page, 'origin-place', 'São', /São Paulo/i);
    await pickPlace(page, 'residence-place', 'São', /São Paulo/i);

    await page.locator('form').getByRole('button', { name: 'pt', exact: true }).click();
    await page.locator('form').getByRole('button', { name: 'en', exact: true }).click();

    await page.getByRole('button', { name: /salvar perfil/i }).click();
    await expect(page.getByText(/perfil salvo/i)).toBeVisible({ timeout: 10_000 });

    await page.goto('/presence');
    await expect(page.getByText(/complete seu perfil/i)).toHaveCount(0);

    await page.locator('button[type="button"]').filter({ hasText: /seg 19:00/i }).first().click();
    await page.locator('#presence-form').getByRole('button', { name: /confirmar presença/i }).click();

    await expect(page.getByText(/presença confirmada/i)).toBeVisible({ timeout: 10_000 });
  });
});

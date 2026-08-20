import { test, expect } from '@playwright/test';
import { mockLogin, pickPlace } from './helpers.js';

test.describe('onboarding smoke', () => {
  test('login, complete profile, declare presence', async ({ page }) => {
    await mockLogin(page, 'novo@demo.ember');

    await expect(page.getByText(/complete seu perfil/i)).toBeVisible();

    await page.goto('/profile');
    await page.getByLabel(/^nome$/i).fill('Membro Novo');
    await page.getByLabel(/ano da edição/i).fill('2024');

    await pickPlace(page, /local de origem/i, 'São', /São Paulo/i);
    await pickPlace(page, /onde mora hoje/i, 'São', /São Paulo/i);

    await page.getByRole('button', { name: /^pt$/i }).click();
    await page.getByRole('button', { name: /^en$/i }).click();

    await page.getByRole('button', { name: /salvar perfil/i }).click();
    await expect(page.getByText(/perfil salvo/i)).toBeVisible();

    await page.goto('/presence');
    await expect(page.getByText(/complete seu perfil/i)).toHaveCount(0);

    await page.locator('button[type="button"]').filter({ hasText: /seg 19:00/i }).first().click();
    await page.getByRole('button', { name: /confirmar presença/i }).first().click();
    await expect(page.getByText(/presença confirmada|presença foi registrada/i)).toBeVisible();
  });
});

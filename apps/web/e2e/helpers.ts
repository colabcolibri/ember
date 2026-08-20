import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export const MOCK_DEMO_CODE = '123456';

export async function mockLogin(page: Page, email: string) {
  await page.goto('/login');
  await page.locator('#email').fill(email);
  await page.locator('#code').fill(MOCK_DEMO_CODE);
  await page.getByRole('button', { name: /^entrar$/i }).click();
  await expect(page).toHaveURL(/\/presence/);
}

export async function pickPlace(page: Page, label: RegExp, query: string, optionText: RegExp) {
  await page.getByRole('combobox', { name: label }).click();
  await page.getByPlaceholder(/buscar cidade|search city/i).fill(query);
  await page.getByRole('option', { name: optionText }).click();
}

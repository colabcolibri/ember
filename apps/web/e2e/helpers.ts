import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export const MOCK_DEMO_CODE = '123456';

export async function mockLogin(page: Page, email: string) {
  await page.goto('/login');
  await expect(page.getByText(/demonstração|demo/i)).toBeVisible();

  await page.locator('#email').fill(email);
  await page.locator('#code').fill(MOCK_DEMO_CODE);
  await page.locator('form button[type="submit"]').click();

  await expect(page).toHaveURL(/\/presence/, { timeout: 15_000 });
}

export async function pickPlace(page: Page, fieldId: string, query: string, optionText: RegExp) {
  await page.locator(`#${fieldId}`).click();
  await page.getByPlaceholder(/buscar cidade|search city/i).fill(query);
  await expect(page.getByRole('option', { name: optionText })).toBeVisible({ timeout: 10_000 });
  await page.getByRole('option', { name: optionText }).click();
}

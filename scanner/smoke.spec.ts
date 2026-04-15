import { test, expect } from '@playwright/test';

test('relay messages page loads', async ({ page }) => {
  await page.goto('/messages');
  await expect(page.getByRole('heading', { name: 'Threads' })).toBeVisible();
});

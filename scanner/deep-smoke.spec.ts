import { test, expect } from '@playwright/test';

const pages = [
  { path: '/', heading: 'Dashboard' },
  { path: '/messages', heading: 'Threads' },
  { path: '/compose', heading: 'Compose' },
  { path: '/prospects', heading: 'Prospects' },
  { path: '/applicants', heading: 'Applicants' },
  { path: '/future-residents', heading: 'Future Residents' },
  { path: '/residents', heading: 'Residents' },
  { path: '/settings', heading: 'Settings' },
  { path: '/blasts', heading: 'Blasts' },
];

test.describe('relay deep page smoke', () => {
  for (const pageDef of pages) {
    test(`${pageDef.path} renders`, async ({ page }) => {
      await page.goto(pageDef.path);
      await expect(page.getByRole('heading', { name: pageDef.heading })).toBeVisible();
      await expect(page.locator('body')).not.toContainText('Application error');
      await expect(page.locator('body')).not.toContainText('Unhandled Runtime Error');
    });
  }
});

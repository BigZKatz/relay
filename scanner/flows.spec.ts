import { test, expect } from '@playwright/test';
import { PrismaClient } from '../app/generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

const uniqueTag = Date.now().toString().slice(-6);
const testPropertyName = `Flow Property ${uniqueTag}`;

test.afterAll(async () => {
  const adapter = new PrismaBetterSqlite3({ url: `file:${path.resolve(process.cwd(), 'dev.db')}` });
  const db = new PrismaClient({ adapter });
  try {
    const prop = await db.property.findFirst({ where: { name: testPropertyName } });
    if (prop) {
      await db.propertySettings.deleteMany({ where: { propertyId: prop.id } });
      await db.propertyBusinessHour.deleteMany({ where: { propertyId: prop.id } });
      await db.notificationRecipient.deleteMany({ where: { propertyId: prop.id } });
      await db.appUser.deleteMany({ where: { propertyId: prop.id } });
      await db.property.delete({ where: { id: prop.id } });
    }
  } finally {
    await db.$disconnect();
  }
});

test.describe('relay flow coverage', () => {
  test('compose page can target a single prospect and send', async ({ page }) => {
    await page.goto('/compose');

    await page.getByRole('button', { name: 'Prospects' }).click();
    await page.getByPlaceholder('Search prospects...').fill('Jordan');
    await page.getByLabel(/Jordan Miles/i).check();

    const message = `Flow test ${uniqueTag}`;
    await page.getByPlaceholder(/Type a direct message/i).fill(message);
    await page.getByRole('button', { name: /Send Direct Message/i }).click();

    await expect(page.getByText(/Message sent to 1 recipient/i)).toBeVisible();
  });

  test('prospects page can add a new prospect', async ({ page }) => {
    await page.goto('/prospects');

    await page.getByRole('button', { name: /add prospect/i }).first().click();

    const form = page.locator('form');
    await form.locator('input').nth(0).fill('Flow');
    await form.locator('input').nth(1).fill(`Lead${uniqueTag}`);
    await form.locator('input').nth(2).fill('5125550199');
    await form.locator('input').nth(3).fill(`flow${uniqueTag}@example.com`);
    await form.locator('input').nth(4).fill('1BR');
    await form.locator('input').nth(5).fill('Playwright');
    await form.locator('textarea').fill('Created by scanner flow test.');
    await form.getByRole('button', { name: /^Add Prospect$/i }).click();

    await expect(page.getByRole('table').getByText(new RegExp(`Flow Lead${uniqueTag}`, 'i'))).toBeVisible();
  });

  test('settings page can create a property shell', async ({ page }) => {
    await page.goto('/settings');

    await page.getByRole('button', { name: /add property/i }).click();
    await page.getByPlaceholder('Property name').fill(testPropertyName);
    await page.getByPlaceholder('Address').fill('123 Flow Street');
    await page.getByPlaceholder('Leasing phone').fill('5125550111');
    await page.getByPlaceholder('Twilio number').fill('5125550222');
    await page.getByPlaceholder('Timezone').fill('America/Denver');
    await page.getByRole('button', { name: /Create property/i }).click();

    await expect(page).toHaveURL(/propertyId=/);
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('messages and threads QA', () => {
  test('renders seeded rich thread content, quick links, and search', async ({ page }) => {
    await page.goto('/messages');

    await expect(page.getByRole('heading', { name: 'Threads' })).toBeVisible();
    await expect(page.getByRole('button', { name: /James Thornton/i })).toBeVisible();

    await page.getByPlaceholder('Search by name, stage, unit, or property…').fill('James');
    await expect(page.getByRole('button', { name: /James Thornton/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Maria Santos/i })).toHaveCount(0);
    await page.getByPlaceholder('Search by name, stage, unit, or property…').fill('');

    await page.getByRole('button', { name: /James Thornton/i }).click();
    await expect(page.getByRole('heading', { name: 'James Thornton' })).toBeVisible();
    await expect(page.getByText(/Redstone Apartments/)).toBeVisible();

    await expect(page.locator('img[alt="qa-sample.jpg"]').first()).toBeVisible();
    await expect(page.locator('video[title="qa-sample.mp4"]').first()).toBeVisible();
    await expect(page.getByText('redstone.example.com').first()).toBeVisible();

    await page.getByTitle('Quick links').click();
    await expect(page.getByText('Saved links for Redstone Apartments')).toBeVisible();
    await page.getByRole('button', { name: /Website/i }).click();
    await expect(page.getByPlaceholder('Type a reply…')).toHaveValue('https://redstone.example.com');
  });

  test('renders link preview card with hostname and URL for seeded message URL', async ({ page }) => {
    await page.goto('/messages');
    await page.getByRole('button', { name: /James Thornton/i }).click();
    await expect(page.getByRole('heading', { name: 'James Thornton' })).toBeVisible();

    // The seeded message contains https://redstone.example.com — card should render
    const card = page.locator('a[href="https://redstone.example.com"]').first();
    await expect(card).toBeVisible();
    // Hostname badge inside the card
    await expect(page.getByText('redstone.example.com').first()).toBeVisible();
    // Card must show some non-empty title text (fallback URL or real title)
    await expect(card.locator('p.font-semibold').first()).not.toBeEmpty();
  });

  test('empty thread state is clean for contacts with no message history', async ({ page }) => {
    await page.goto('/messages');

    // Jason Kim is seeded as an applicant with no messages
    await page.getByPlaceholder('Search by name, stage, unit, or property…').fill('Jason Kim');
    await expect(page.getByRole('button', { name: /Jason Kim/i })).toBeVisible();
    await page.getByRole('button', { name: /Jason Kim/i }).click();

    await expect(page.getByText('No messages yet', { exact: true })).toBeVisible();
    await expect(page.getByText('Send a reply below to start the conversation.')).toBeVisible();
    await expect(page.getByPlaceholder('Type a reply…')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send reply' })).toBeVisible();
  });

  test('supports text replies and local attachment previews with MMS warning', async ({ page }) => {
    await page.goto('/messages');
    await page.getByRole('button', { name: /James Thornton/i }).click();

    const composer = page.getByPlaceholder('Type a reply…');
    await composer.fill('Scanner lane text reply');
    await page.getByRole('button', { name: 'Send reply' }).click();
    await expect(page.locator('div').filter({ hasText: 'Scanner lane text reply' }).first()).toBeVisible();
    await expect(composer).toHaveValue('');

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByTitle('Attach media').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(path.resolve(__dirname, '../public/qa-sample.jpg'));

    await expect(page.getByRole('link', { name: /qa-sample.jpg/i }).last()).toBeVisible();
    await expect(page.getByText(/Attachments render here, but outbound MMS is not ready yet\./i)).toBeVisible();
    await expect(page.getByText(/Outbound MMS requires PUBLIC_APP_URL or NEXT_PUBLIC_APP_URL/i)).toBeVisible();
  });
});

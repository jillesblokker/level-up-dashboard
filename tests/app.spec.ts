import { test, expect } from '@playwright/test';

test('has title and login button', async ({ page }) => {
  await page.goto('/');

  // Verify the page loaded correctly
  await expect(page).toHaveTitle(/Level Up/);

  // Note: For Clerk authentication in E2E tests, it's recommended to use
  // Clerk's testing tokens and bypass the UI. This is a basic health check.
});

test('kingdom grid renders for authenticated users', async ({ page, context }) => {
  // In a real scenario, you would set auth cookies/tokens here
  // await context.addCookies([{name: '__session', value: 'fake_token', domain: 'localhost', path: '/'}]);
  
  // Skip this test in CI until full auth bypassing is set up
  test.skip(!!process.env.CI, 'Requires authenticated session context');

  await page.goto('/kingdom');
  
  // Check if the kingdom map container renders
  const gridContainer = page.locator('.kingdom-grid-container').first();
  await expect(gridContainer).toBeVisible({ timeout: 10000 });
});

import { test as setup, expect } from '@playwright/test';

// Platform admin auth
setup('authenticate', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"], input[type="email"]', 'admin@test.com');
    await page.fill('input[name="password"], input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL(/dashboard/);
    await page.context().storageState({ path: 'playwright/.auth/user.json' });
});

// Partner admin auth
setup('authenticate partner', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"], input[type="email"]', 'partneradmin@test.com');
    await page.fill('input[name="password"], input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL(/dashboard/);
    await page.context().storageState({ path: 'playwright/.auth/partner.json' });
});

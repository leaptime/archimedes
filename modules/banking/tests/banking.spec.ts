import { test, expect } from '../../core/tests/fixtures';

test.describe('Banking Module', () => {
    test.describe('Dashboard', () => {
        test('should display banking page', async ({ page }) => {
            await page.goto('/banking');
            await expect(page.locator('h1')).toContainText('Banking');
        });

        test('should show summary cards', async ({ page }) => {
            await page.goto('/banking');
            await expect(page.getByText('Bank Accounts', { exact: true })).toBeVisible();
            await expect(page.getByText('Transactions', { exact: true })).toBeVisible();
            await expect(page.getByText('Balance', { exact: true })).toBeVisible();
        });

        test('should show connected accounts count', async ({ page }) => {
            await page.goto('/banking');
            await expect(page.getByText('Connected accounts')).toBeVisible();
        });

        test('should show pending reconciliation count', async ({ page }) => {
            await page.goto('/banking');
            await expect(page.getByText('Pending reconciliation')).toBeVisible();
        });

        test('should show total balance', async ({ page }) => {
            await page.goto('/banking');
            await expect(page.getByText('Total balance')).toBeVisible();
        });
    });
});

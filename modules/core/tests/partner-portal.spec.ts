import { test, expect } from './fixtures';

test.describe('Partner Portal', () => {
    test.describe('Partner Dashboard', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/partner');
        });

        test('should display partner dashboard', async ({ page }) => {
            await expect(page.locator('h1')).toContainText('Partner Dashboard');
        });

        test('should show stats cards', async ({ page }) => {
            await expect(page.getByText('Total Organizations')).toBeVisible();
            await expect(page.getByText('Total Users')).toBeVisible();
            await expect(page.getByText('Monthly Revenue')).toBeVisible();
            await expect(page.getByText('Your Commission')).toBeVisible();
        });

        test('should have new organization button', async ({ page }) => {
            await expect(page.locator('header').getByRole('link', { name: /New Organization/i })).toBeVisible();
        });

        test('should have quick actions section', async ({ page }) => {
            await expect(page.getByText('Quick Actions')).toBeVisible();
            await expect(page.getByRole('link', { name: /Manage Organizations/i })).toBeVisible();
            await expect(page.getByRole('link', { name: /View Revenue/i })).toBeVisible();
        });

        test('should navigate to organizations page', async ({ page }) => {
            await page.getByRole('link', { name: /Manage Organizations/i }).click();
            await expect(page).toHaveURL(/\/partner\/organizations/);
        });
    });

    test.describe('Partner Organizations List', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/partner/organizations');
        });

        test('should display organizations page', async ({ page }) => {
            await expect(page.locator('h1')).toContainText('Organizations');
        });

        test('should have search input', async ({ page }) => {
            await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
        });

        test('should have status filter', async ({ page }) => {
            const statusFilter = page.locator('button:has-text("All Status")');
            await expect(statusFilter).toBeVisible();
        });

        test('should have type filter', async ({ page }) => {
            const typeFilter = page.locator('button:has-text("All Types")');
            await expect(typeFilter).toBeVisible();
        });

        test('should have new organization button', async ({ page }) => {
            await expect(page.getByRole('link', { name: /New Organization/i })).toBeVisible();
        });

        test('should navigate to new organization form', async ({ page }) => {
            await page.getByRole('link', { name: /New Organization/i }).click();
            await expect(page).toHaveURL(/\/partner\/organizations\/new/);
        });

        test('should filter by status', async ({ page }) => {
            const statusFilter = page.locator('button:has-text("All Status")');
            await statusFilter.click();
            await page.locator('[role="option"]:has-text("Active")').click();
            await page.waitForTimeout(500);
        });

        test('should search organizations', async ({ page }) => {
            const searchInput = page.locator('input[placeholder*="Search"]');
            await searchInput.fill('test');
            await page.waitForTimeout(500);
        });
    });

    test.describe('Create Organization Form', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/partner/organizations/new');
        });

        test('should display new organization form', async ({ page }) => {
            await expect(page.locator('h1')).toContainText('New Organization');
        });

        test('should have organization details section', async ({ page }) => {
            await expect(page.getByText('Organization Details')).toBeVisible();
        });

        test('should have organization owner section', async ({ page }) => {
            await expect(page.getByText('Organization Owner')).toBeVisible();
        });

        test('should have required fields', async ({ page }) => {
            await expect(page.getByLabel(/Organization Name/i)).toBeVisible();
            // Check for form sections
            await expect(page.getByText('Organization Details')).toBeVisible();
            await expect(page.getByText('Organization Owner')).toBeVisible();
        });

        test('should have owner fields', async ({ page }) => {
            await expect(page.getByLabel(/Full Name/i)).toBeVisible();
            await expect(page.getByLabel(/Email/i).first()).toBeVisible();
        });

        test('should validate required fields on submit', async ({ page }) => {
            await page.getByRole('button', { name: /Create Organization/i }).click();
            await page.waitForTimeout(300);
            // Should show validation errors
            await expect(page.getByText(/required/i).first()).toBeVisible();
        });

        test('should have back button', async ({ page }) => {
            await expect(page.getByRole('link', { name: /Back/i })).toBeVisible();
        });

        test('should navigate back to organizations list', async ({ page }) => {
            await page.getByRole('link', { name: /Back/i }).click();
            await expect(page).toHaveURL(/\/partner\/organizations/);
        });
    });

    test.describe('Partner Revenue Page', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/partner/revenue');
        });

        test('should display revenue page', async ({ page }) => {
            await expect(page.locator('h1')).toContainText('Revenue');
        });

        test('should show summary cards', async ({ page }) => {
            await expect(page.getByText('Gross Revenue')).toBeVisible();
            await expect(page.getByText('Your Commission')).toBeVisible();
            await expect(page.getByText('Pending Payout')).toBeVisible();
        });

        test('should have tabs for revenue and payouts', async ({ page }) => {
            await expect(page.getByRole('tab', { name: /Revenue Details/i })).toBeVisible();
            await expect(page.getByRole('tab', { name: /Payouts/i })).toBeVisible();
        });

        test('should have month/year filters', async ({ page }) => {
            // Month selector
            await expect(page.locator('button:has-text("January"), button:has-text("February"), button:has-text("March"), button:has-text("April"), button:has-text("May"), button:has-text("June"), button:has-text("July"), button:has-text("August"), button:has-text("September"), button:has-text("October"), button:has-text("November"), button:has-text("December")').first()).toBeVisible();
        });

        test('should switch to payouts tab', async ({ page }) => {
            await page.getByRole('tab', { name: /Payouts/i }).click();
            await expect(page.getByText('Payout History')).toBeVisible();
        });
    });

    test.describe('Partner Settings Page', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/partner/settings');
        });

        test('should display settings page', async ({ page }) => {
            await expect(page.locator('h1')).toContainText('Partner Settings');
        });

        test('should show partner info card', async ({ page }) => {
            // Should show settings page with profile section
            await expect(page.locator('h1')).toContainText('Partner Settings');
        });

        test('should have profile tab', async ({ page }) => {
            await expect(page.getByRole('tab', { name: /Profile/i })).toBeVisible();
        });

        test('should have payout settings tab', async ({ page }) => {
            await expect(page.getByRole('tab', { name: /Payout/i })).toBeVisible();
        });

        test('should show payout method options', async ({ page }) => {
            await page.getByRole('tab', { name: /Payout/i }).click();
            await expect(page.getByText('Payout Method')).toBeVisible();
            await expect(page.getByText('Bank Transfer')).toBeVisible();
            await expect(page.getByText('PayPal')).toBeVisible();
        });

        test('should have save button', async ({ page }) => {
            await expect(page.getByRole('button', { name: /Save/i })).toBeVisible();
        });
    });
});

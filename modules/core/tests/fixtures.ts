import { test as base, expect, Page, Locator } from '@playwright/test';

/**
 * Standard test fixtures for Archimedes modules
 * All module tests should extend from this
 */

// Page Object helpers
export class ModuleTestHelpers {
    constructor(public page: Page) {}

    // Navigation
    async navigateTo(path: string) {
        await this.page.goto(path);
        await this.page.waitForLoadState('networkidle');
    }

    // Wait for API response
    async waitForApi(urlPattern: string | RegExp) {
        return this.page.waitForResponse(
            response => response.url().match(urlPattern) !== null && response.status() === 200
        );
    }

    // Dialog helpers
    async openDialog(triggerSelector: string) {
        await this.page.click(triggerSelector);
        await this.page.waitForSelector('[role="dialog"]', { state: 'visible' });
    }

    async closeDialog() {
        await this.page.click('[role="dialog"] button:has-text("Cancel")');
        await this.page.waitForSelector('[role="dialog"]', { state: 'hidden' });
    }

    async submitDialog() {
        await this.page.click('[role="dialog"] button[type="submit"]');
    }

    // Form helpers
    async fillField(name: string, value: string) {
        const input = this.page.locator(`input[name="${name}"], textarea[name="${name}"]`);
        await input.fill(value);
    }

    async selectOption(name: string, value: string) {
        await this.page.click(`[data-field="${name}"] button, button:has-text("Select")`);
        await this.page.click(`[role="option"]:has-text("${value}")`);
    }

    async toggleSwitch(name: string, checked: boolean) {
        const switchEl = this.page.locator(`[data-field="${name}"] button[role="switch"], #${name}`);
        const isChecked = await switchEl.getAttribute('data-state') === 'checked';
        if (isChecked !== checked) {
            await switchEl.click();
        }
    }

    // Table/List helpers
    async getTableRowCount(): Promise<number> {
        return this.page.locator('table tbody tr, [data-testid="list-item"]').count();
    }

    async clickRowAction(rowText: string, action: string) {
        const row = this.page.locator(`tr:has-text("${rowText}"), [data-testid="list-item"]:has-text("${rowText}")`);
        await row.hover();
        await row.locator(`button:has-text("${action}"), button[aria-label="${action}"]`).click();
    }

    // Toast/notification helpers
    async expectToast(message: string | RegExp) {
        const toast = this.page.locator('[data-sonner-toast], [role="alert"]');
        await expect(toast).toContainText(message);
    }

    // Card grid helpers
    async getCardCount(): Promise<number> {
        return this.page.locator('[data-testid="contact-card"], .grid > div').count();
    }

    // Search
    async search(query: string) {
        const searchInput = this.page.locator('input[placeholder*="Search"]');
        await searchInput.fill(query);
        // Small delay for debounce
        await this.page.waitForTimeout(300);
    }

    // Stats
    async getStatValue(label: string): Promise<string> {
        const stat = this.page.locator(`text=${label}`).locator('..').locator('p').first();
        return stat.textContent() || '';
    }
}

// Extended test with helpers
export const test = base.extend<{ helpers: ModuleTestHelpers }>({
    helpers: async ({ page }, use) => {
        const helpers = new ModuleTestHelpers(page);
        await use(helpers);
    },
});

export { expect };

// Test data generators
export const testData = {
    contact: {
        company: () => ({
            name: `Test Company ${Date.now()}`,
            email: `company${Date.now()}@test.com`,
            phone: '+1234567890',
            is_company: true,
            is_customer: true,
        }),
        individual: () => ({
            name: `John Doe ${Date.now()}`,
            email: `john${Date.now()}@test.com`,
            phone: '+0987654321',
            company: 'Acme Inc',
            job_title: 'Developer',
            is_company: false,
            is_customer: true,
        }),
    },
};

// API helpers for test setup/teardown
export async function apiRequest(page: Page, method: string, url: string, data?: any) {
    return page.evaluate(
        async ({ method, url, data }) => {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': document.cookie
                        .split('; ')
                        .find(row => row.startsWith('XSRF-TOKEN='))
                        ?.split('=')[1]
                        ?.replace(/%3D/g, '=') || '',
                },
                body: data ? JSON.stringify(data) : undefined,
                credentials: 'include',
            });
            return response.json();
        },
        { method, url, data }
    );
}

// Cleanup helper
export async function cleanupTestData(page: Page, model: string, namePattern: string) {
    // This would call an API to delete test data
    // For now, we'll rely on database transactions or manual cleanup
}

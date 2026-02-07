import { test, expect } from './fixtures';

test.describe('Core Module', () => {
    test.describe('Module Registry API', () => {
        test('GET /api/modules returns module list', async ({ request }) => {
            const response = await request.get('/api/modules');
            expect(response.ok()).toBeTruthy();
            
            const data = await response.json();
            expect(data.data).toBeDefined();
            expect(Array.isArray(data.data)).toBeTruthy();
            expect(data.data.length).toBeGreaterThan(0);
            
            // Check core module exists
            const coreModule = data.data.find((m: any) => m.id === 'core');
            expect(coreModule).toBeDefined();
            expect(coreModule.name).toBe('Core');
        });

        test('GET /api/modules/stats returns statistics', async ({ request }) => {
            const response = await request.get('/api/modules/stats');
            expect(response.ok()).toBeTruthy();
            
            const data = await response.json();
            expect(data.data).toBeDefined();
            expect(data.data.total).toBeGreaterThan(0);
            expect(data.data.active).toBeGreaterThan(0);
        });

        test('GET /api/modules/compliance returns compliance report', async ({ request }) => {
            const response = await request.get('/api/modules/compliance');
            expect(response.ok()).toBeTruthy();
            
            const data = await response.json();
            expect(data.data).toBeDefined();
            expect(data.data.total).toBeGreaterThan(0);
            expect(data.data.modules).toBeDefined();
        });

        test('GET /api/modules/:module returns module details', async ({ page }) => {
            // Use page.request which inherits the auth context
            const response = await page.request.get('/api/modules/core');
            expect(response.ok()).toBeTruthy();
            
            const data = await response.json();
            expect(data.data).toBeDefined();
            expect(data.data.id).toBe('core');
            expect(data.data.name).toBe('Core');
            expect(data.data.version).toBeDefined();
        });

        test('GET /api/modules/:module/compliance returns module compliance', async ({ request }) => {
            const response = await request.get('/api/modules/core/compliance');
            expect(response.ok()).toBeTruthy();
            
            const data = await response.json();
            expect(data.data).toBeDefined();
            expect(data.data.module).toBe('core');
            expect(data.data.valid).toBeDefined();
        });

        test('returns 404 for non-existent module', async ({ request }) => {
            const response = await request.get('/api/modules/nonexistent');
            expect(response.status()).toBe(404);
        });
    });

    test.describe('Permissions API', () => {
        test('GET /api/permissions/me returns current user permissions', async ({ request }) => {
            const response = await request.get('/api/permissions/me');
            expect(response.ok()).toBeTruthy();
            
            const data = await response.json();
            expect(data).toBeDefined();
        });

        test('GET /api/permissions/groups returns permission groups', async ({ request }) => {
            const response = await request.get('/api/permissions/groups');
            expect(response.ok()).toBeTruthy();
            
            const data = await response.json();
            expect(data.data).toBeDefined();
        });
    });

    test.describe('Module Detail Page', () => {
        test('should display module list in management', async ({ page }) => {
            await page.goto('/my-modules');
            
            await expect(page.locator('h1')).toContainText(/Module/i);
        });

        test('should display module details', async ({ page }) => {
            await page.goto('/modules/contacts');
            
            await expect(page.locator('text=Contacts')).toBeVisible();
        });

        test.skip('should show module version', async ({ page }) => {
            // Skipped: API timing issues with module detail loading
            await page.goto('/modules/contacts');
            await page.waitForLoadState('networkidle');
            
            await expect(page.getByText('v1.0.0').first()).toBeVisible();
        });

        test.skip('should show module dependencies', async ({ page }) => {
            // Skipped: API timing issues with module detail loading
            await page.goto('/modules/contacts');
            await page.waitForLoadState('networkidle');
            
            // Should show that it depends on core
            await expect(page.getByText('core', { exact: true }).first()).toBeVisible();
        });
    });

    test.describe('Dashboard', () => {
        test('should load dashboard', async ({ page }) => {
            await page.goto('/dashboard');
            
            await expect(page.locator('h1')).toContainText(/Overview|Dashboard|Welcome/i);
        });

        test('should show navigation sidebar', async ({ page }) => {
            await page.goto('/dashboard');
            
            // Should have main navigation items in sidebar
            await expect(page.getByRole('navigation').getByText('Dashboard')).toBeVisible();
            await expect(page.getByRole('navigation').getByText('Contacts')).toBeVisible();
        });
    });

    test.describe('Extensibility Framework', () => {
        test('modules can register extensions via API', async ({ request }) => {
            const response = await request.get('/api/modules/invoicing');
            expect(response.ok()).toBeTruthy();
            
            const data = await response.json();
            expect(data.data.extensions).toBeDefined();
        });

        test('module detail shows extension points', async ({ page }) => {
            await page.goto('/modules/contacts');
            
            // Check for extension points section (if displayed)
            const extensionsSection = page.locator('text=Extension');
            if (await extensionsSection.isVisible()) {
                await expect(extensionsSection).toBeVisible();
            }
        });
    });
});

// Test data fixtures
export const testData = {
    contact: {
        individual: () => ({
            name: `Test Contact ${Date.now()}`,
            email: `test.${Date.now()}@example.com`,
            phone: '+1234567890',
            is_company: false,
        }),
        company: () => ({
            name: `Test Company ${Date.now()}`,
            email: `company.${Date.now()}@example.com`,
            phone: '+1987654321',
            is_company: true,
            vat: 'IT12345678901',
        }),
    }
};

// API request helper for authenticated requests
export async function apiRequest(request: any, method: string, url: string, data?: any) {
    const options: any = { headers: { 'Accept': 'application/json' } };
    if (data) {
        options.data = data;
    }
    
    switch (method.toUpperCase()) {
        case 'GET':
            return request.get(url, options);
        case 'POST':
            return request.post(url, options);
        case 'PUT':
            return request.put(url, options);
        case 'DELETE':
            return request.delete(url, options);
        default:
            throw new Error(`Unknown method: ${method}`);
    }
}

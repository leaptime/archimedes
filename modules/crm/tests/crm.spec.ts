import { test, expect } from '@playwright/test';

// Test fixtures
const testData = {
    lead: {
        new: () => ({
            name: `Test Lead ${Date.now()}`,
            contact_name: 'John Doe',
            partner_name: 'Acme Corp',
            email: `test.${Date.now()}@example.com`,
            phone: '+1234567890',
            expected_revenue: 10000,
            date_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        }),
        opportunity: () => ({
            name: `Test Opportunity ${Date.now()}`,
            type: 'opportunity',
            contact_name: 'Jane Smith',
            partner_name: 'Big Corp',
            email: `opp.${Date.now()}@example.com`,
            expected_revenue: 50000,
            priority: 2,
        }),
    }
};

test.describe('CRM Module', () => {
    test.describe('Pipeline View', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/crm');
        });

        test('should display pipeline page with stages', async ({ page }) => {
            await expect(page.locator('h1')).toContainText('CRM Pipeline');
            // Should have stage columns
            await expect(page.locator('text=New')).toBeVisible();
            await expect(page.locator('text=Qualified')).toBeVisible();
            await expect(page.locator('text=Proposition')).toBeVisible();
        });

        test('should display stats cards', async ({ page }) => {
            await expect(page.locator('text=Open Pipeline')).toBeVisible();
            await expect(page.locator('text=Weighted Value')).toBeVisible();
            await expect(page.locator('text=Won This Month')).toBeVisible();
        });

        test('should have view type tabs', async ({ page }) => {
            await expect(page.getByRole('tab', { name: 'Opportunities' })).toBeVisible();
            await expect(page.getByRole('tab', { name: 'Leads' })).toBeVisible();
            await expect(page.getByRole('tab', { name: 'All' })).toBeVisible();
        });

        test('should switch to leads view', async ({ page }) => {
            await page.getByRole('tab', { name: 'Leads' }).click();
            await page.waitForResponse(resp => 
                resp.url().includes('/api/crm/pipeline') && 
                resp.url().includes('type=lead')
            );
        });

        test('should have new opportunity button', async ({ page }) => {
            await expect(page.getByRole('button', { name: /New/ })).toBeVisible();
        });

        test('should navigate to list view', async ({ page }) => {
            await page.getByRole('button', { name: 'View as List' }).click();
            await expect(page).toHaveURL(/\/crm\/leads/);
        });
    });

    test.describe('Leads List View', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/crm/leads');
        });

        test('should display leads list page', async ({ page }) => {
            await expect(page.locator('h1')).toContainText('Leads & Opportunities');
        });

        test('should have search input', async ({ page }) => {
            const searchInput = page.locator('input[placeholder*="Search"]');
            await expect(searchInput).toBeVisible();
        });

        test('should have status tabs', async ({ page }) => {
            await expect(page.getByRole('tab', { name: 'All' })).toBeVisible();
            await expect(page.getByRole('tab', { name: 'Open' })).toBeVisible();
            await expect(page.getByRole('tab', { name: 'Won' })).toBeVisible();
            await expect(page.getByRole('tab', { name: 'Lost' })).toBeVisible();
        });

        test('should filter by status', async ({ page }) => {
            await page.getByRole('tab', { name: 'Won' }).click();
            await page.waitForResponse(resp => 
                resp.url().includes('/api/crm/leads') && 
                resp.url().includes('status=won')
            );
        });

        test('should have type filter', async ({ page }) => {
            const typeSelect = page.locator('button:has-text("All Types")');
            await expect(typeSelect).toBeVisible();
        });

        test('should navigate to pipeline view', async ({ page }) => {
            await page.getByRole('button', { name: 'Pipeline View' }).click();
            await expect(page).toHaveURL(/\/crm$/);
        });
    });

    test.describe('Create Lead', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/crm/leads/new');
        });

        test('should display create form', async ({ page }) => {
            await expect(page.locator('h1')).toContainText('New Lead');
        });

        test('should have form sections', async ({ page }) => {
            await expect(page.locator('text=Basic Information')).toBeVisible();
            await expect(page.locator('text=Contact Information')).toBeVisible();
            await expect(page.locator('text=Revenue')).toBeVisible();
        });

        test('should have type selector', async ({ page }) => {
            await expect(page.locator('button:has-text("Opportunity")')).toBeVisible();
        });

        test('should have priority selector', async ({ page }) => {
            await expect(page.locator('button:has-text("Low")')).toBeVisible();
        });

        test('should create a new lead', async ({ page }) => {
            const leadData = testData.lead.new();
            
            // Fill basic info
            await page.fill('input#name', leadData.name);
            await page.fill('input#contact_name', leadData.contact_name);
            await page.fill('input#partner_name', leadData.partner_name);
            await page.fill('input#email', leadData.email);
            await page.fill('input#expected_revenue', leadData.expected_revenue.toString());
            
            // Submit
            await page.getByRole('button', { name: 'Save' }).click();
            
            // Should redirect to detail page
            await expect(page).toHaveURL(/\/crm\/leads\/\d+$/);
            await expect(page.locator('h1')).toContainText(leadData.name);
        });

        test('should show validation errors', async ({ page }) => {
            // Try to submit without name
            await page.getByRole('button', { name: 'Save' }).click();
            
            // Should show validation error
            await expect(page.locator('text=name')).toBeVisible();
        });
    });

    test.describe('Lead Detail', () => {
        let leadId: number;

        test.beforeAll(async ({ request }) => {
            // Create a test lead via API
            const response = await request.post('/api/crm/leads', {
                data: testData.lead.opportunity(),
            });
            const data = await response.json();
            leadId = data.data.id;
        });

        test('should display lead details', async ({ page }) => {
            await page.goto(`/crm/leads/${leadId}`);
            
            await expect(page.locator('text=Stage')).toBeVisible();
            await expect(page.locator('text=Revenue')).toBeVisible();
            await expect(page.locator('text=Contact')).toBeVisible();
        });

        test('should show stage pipeline', async ({ page }) => {
            await page.goto(`/crm/leads/${leadId}`);
            
            // Should have stage selector
            await expect(page.locator('button:has-text("New")')).toBeVisible();
        });

        test('should show action buttons', async ({ page }) => {
            await page.goto(`/crm/leads/${leadId}`);
            
            await expect(page.getByRole('button', { name: 'Won' })).toBeVisible();
            await expect(page.getByRole('button', { name: 'Lost' })).toBeVisible();
            await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible();
        });

        test('should show activities section', async ({ page }) => {
            await page.goto(`/crm/leads/${leadId}`);
            
            await expect(page.locator('text=Activities')).toBeVisible();
            await expect(page.getByRole('button', { name: 'Schedule Activity' })).toBeVisible();
        });

        test('should schedule an activity', async ({ page }) => {
            await page.goto(`/crm/leads/${leadId}`);
            
            await page.getByRole('button', { name: 'Schedule Activity' }).click();
            
            // Dialog should open
            await expect(page.locator('[role="dialog"]')).toBeVisible();
            await expect(page.locator('[role="dialog"] h2')).toContainText('Schedule Activity');
            
            // Fill activity form
            await page.locator('[role="dialog"]').fill('input', 'Follow up call');
            
            // Select type
            await page.locator('[role="dialog"] button:has-text("Task")').click();
            await page.locator('[role="option"]:has-text("Call")').click();
            
            // Submit
            await page.locator('[role="dialog"] button:has-text("Schedule")').click();
        });

        test('should change stage', async ({ page }) => {
            await page.goto(`/crm/leads/${leadId}`);
            
            // Click stage selector
            await page.locator('button:has-text("New")').first().click();
            
            // Select different stage
            await page.locator('[role="option"]:has-text("Qualified")').click();
            
            // Should update
            await page.waitForResponse(resp => resp.url().includes('/move'));
        });

        test('should mark as won', async ({ page }) => {
            // Create a fresh lead for this test
            const response = await page.request.post('/api/crm/leads', {
                data: testData.lead.opportunity(),
            });
            const data = await response.json();
            const testLeadId = data.data.id;
            
            await page.goto(`/crm/leads/${testLeadId}`);
            
            await page.getByRole('button', { name: 'Won' }).click();
            
            // Should show won dialog
            await expect(page.locator('[role="dialog"]')).toBeVisible();
            await expect(page.locator('[role="dialog"] h2')).toContainText('Mark as Won');
            
            // Submit
            await page.locator('[role="dialog"] button:has-text("Mark as Won")').click();
            
            await page.waitForResponse(resp => resp.url().includes('/won'));
        });

        test('should mark as lost', async ({ page }) => {
            // Create a fresh lead for this test
            const response = await page.request.post('/api/crm/leads', {
                data: testData.lead.opportunity(),
            });
            const data = await response.json();
            const testLeadId = data.data.id;
            
            await page.goto(`/crm/leads/${testLeadId}`);
            
            await page.getByRole('button', { name: 'Lost' }).click();
            
            // Should show lost dialog
            await expect(page.locator('[role="dialog"]')).toBeVisible();
            await expect(page.locator('[role="dialog"] h2')).toContainText('Mark as Lost');
            
            // Select reason
            await page.locator('[role="dialog"] button:has-text("Select reason")').click();
            await page.locator('[role="option"]').first().click();
            
            // Submit
            await page.locator('[role="dialog"] button:has-text("Mark as Lost")').click();
            
            await page.waitForResponse(resp => resp.url().includes('/lost'));
        });
    });

    test.describe('Pipeline Drag & Drop', () => {
        test('should allow dragging cards between stages', async ({ page }) => {
            // Create a lead first
            const response = await page.request.post('/api/crm/leads', {
                data: testData.lead.opportunity(),
            });
            const data = await response.json();
            
            await page.goto('/crm');
            
            // Find the lead card
            const leadCard = page.locator(`text=${data.data.name}`).first();
            await expect(leadCard).toBeVisible();
            
            // Cards should be draggable
            const card = leadCard.locator('xpath=ancestor::div[contains(@class, "cursor-grab")]');
            await expect(card).toHaveAttribute('draggable', 'true');
        });
    });

    test.describe('API Endpoints', () => {
        test('GET /api/crm/pipeline returns pipeline data', async ({ request }) => {
            const response = await request.get('/api/crm/pipeline');
            expect(response.ok()).toBeTruthy();
            
            const data = await response.json();
            expect(data.data).toBeDefined();
            expect(Array.isArray(data.data)).toBeTruthy();
        });

        test('GET /api/crm/stats returns statistics', async ({ request }) => {
            const response = await request.get('/api/crm/stats');
            expect(response.ok()).toBeTruthy();
            
            const data = await response.json();
            expect(data.data).toBeDefined();
            expect(data.data.open_count).toBeDefined();
            expect(data.data.won_count).toBeDefined();
        });

        test('GET /api/crm/stages returns stages', async ({ request }) => {
            const response = await request.get('/api/crm/stages');
            expect(response.ok()).toBeTruthy();
            
            const data = await response.json();
            expect(data.data).toBeDefined();
            expect(data.data.length).toBeGreaterThan(0);
        });

        test('GET /api/crm/lost-reasons returns lost reasons', async ({ request }) => {
            const response = await request.get('/api/crm/lost-reasons');
            expect(response.ok()).toBeTruthy();
            
            const data = await response.json();
            expect(data.data).toBeDefined();
        });

        test('POST /api/crm/leads creates a lead', async ({ request }) => {
            const leadData = testData.lead.new();
            
            const response = await request.post('/api/crm/leads', {
                data: leadData,
            });
            expect(response.ok()).toBeTruthy();
            
            const data = await response.json();
            expect(data.data.id).toBeDefined();
            expect(data.data.name).toBe(leadData.name);
        });

        test('POST /api/crm/leads/:id/convert converts lead to opportunity', async ({ request }) => {
            // Create a lead
            const createResponse = await request.post('/api/crm/leads', {
                data: { ...testData.lead.new(), type: 'lead' },
            });
            const created = await createResponse.json();
            
            // Convert it
            const response = await request.post(`/api/crm/leads/${created.data.id}/convert`);
            expect(response.ok()).toBeTruthy();
            
            const data = await response.json();
            expect(data.data.type).toBe('opportunity');
        });
    });
});

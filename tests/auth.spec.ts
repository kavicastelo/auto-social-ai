import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test('should login successfully with demo credentials', async ({ page }) => {
        // Go to login page
        await page.goto('/login');

        // Fill credentials
        await page.fill('input[type="email"]', 'demo@example.com');
        await page.fill('input[type="password"]', 'password123');

        // Submit
        await page.click('button[type="submit"]');

        // Expect to see dashboard
        await expect(page).toHaveURL('/');
        await expect(page.locator('h1')).toContainText('Dashboard');
    });

    test('should show error on invalid credentials', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', 'wrong@example.com');
        await page.fill('input[type="password"]', 'wrongpass');
        await page.click('button[type="submit"]');

        // Check for error message (sonner toast error or direct message)
        // Based on our implementation, it shows a div[text=error]
        const errorMsg = page.locator('div:has-text("Authentication failed")');
        await expect(errorMsg).toBeVisible();
    });
});

test.describe('Navigation', () => {
    test.beforeEach(async ({ page }) => {
        // Login before each test
        await page.goto('/login');
        await page.fill('input[type="email"]', 'demo@example.com');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');
    });

    test('should navigate to Content Studio', async ({ page }) => {
        await page.click('a[href="/content"]');
        await expect(page).toHaveURL('/content');
        await expect(page.locator('h2')).toContainText('Content Studio');
    });

    test('should navigate to Analytics', async ({ page }) => {
        await page.click('a[href="/analytics"]');
        await expect(page).toHaveURL('/analytics');
        await expect(page.locator('h2')).toContainText('Analytics Overview');
    });
});

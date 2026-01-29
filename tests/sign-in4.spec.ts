import { test, expect } from '@playwright/test';
import { credentials } from './credentials';

test.describe('Sign In Page', () => {
    test('Login with valid credentials', async ({ page }) => {
        // Navigate to the sign-in page
        await page.goto('https://alexusadays.com/login');
        await page.locator('#username').fill(credentials.username);
        await page.locator('#password').fill(credentials.password);
        await page.locator('#login-btn').click();
        // Verify successful login by checking for a specific element on the dashboard
        await expect(page).toHaveURL(/secure(\.html)?$/);
        await expect(page.getByText('Welcome! You are logged into secure area of the application.')).toBeVisible();
    })
});

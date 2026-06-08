const { test, expect } = require('@playwright/test');

// ST-AUTH: Authentication flows — black-box system tests

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123';

test.describe('Authentication', () => {
  test('ST-AUTH-01: valid admin credentials → login succeeds and redirects away from /login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', ADMIN_EMAIL);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]:has-text("Login")');

    // After successful login the app should navigate away from the login page
    await expect(page).not.toHaveURL(/\/login/, { timeout: 8000 });
  });

  test('ST-AUTH-02: wrong password → stays on login page with an error', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', ADMIN_EMAIL);
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]:has-text("Login")');

    // Should remain on login (or show error) — must NOT navigate away successfully
    await page.waitForTimeout(2000);
    const url = page.url();
    const hasError =
      url.includes('/login') ||
      (await page.locator('text=/invalid|incorrect|wrong|failed/i').count()) > 0;
    expect(hasError).toBe(true);
  });

  test('ST-AUTH-03: empty form submission → stays on login page', async ({ page }) => {
    await page.goto('/login');
    await page.click('button[type="submit"]:has-text("Login")');
    await page.waitForTimeout(1500);
    await expect(page).toHaveURL(/\/login/);
  });

  test('ST-AUTH-04: authenticated user can log out', async ({ page }) => {
    // Log in first
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', ADMIN_EMAIL);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]:has-text("Login")');
    await expect(page).not.toHaveURL(/\/login/, { timeout: 8000 });
    await page.waitForLoadState('networkidle');

    // Open the user dropdown (nav shows "admin ▾") then click Sign Out
    await page.locator('.nav-link:has-text("admin")').click();
    await page.locator('button:has-text("Sign Out")').first().click();

    // After logout the user should be on login or home, not a protected page
    await page.waitForTimeout(1500);
    const finalUrl = page.url();
    expect(finalUrl).not.toContain('/dashboard');
  });
});

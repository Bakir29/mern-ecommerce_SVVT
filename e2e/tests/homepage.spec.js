const { test, expect } = require('@playwright/test');

// ST-HOME: Homepage and navigation — black-box system tests
// Tests the publicly accessible shell of the app without authentication.

test.describe('Homepage and navigation', () => {
  test('ST-HOME-01: homepage loads and shows the site brand/logo', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/mern|ecommerce|store/i);
    // Navigation bar must be present
    await expect(page.locator('.navbar').first()).toBeVisible();
  });

  test('ST-HOME-02: Shop link navigates to the product listing page', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/shop"]');
    await expect(page).toHaveURL(/\/shop/);
  });

  test('ST-HOME-03: unauthenticated user visiting /dashboard sees no private content', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    // The SPA auth guard renders an empty page (no redirect, just blank render).
    // Assert that no private dashboard content (order history, account data) is visible.
    const body = await page.textContent('body');
    const hasPrivateContent = /my orders|account details|order history|welcome back/i.test(body);
    expect(hasPrivateContent).toBe(false);
  });

  test('ST-HOME-04: Login page renders email and password fields', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    // Two input[name="email"] exist (login form + footer newsletter) — scope by placeholder
    await expect(page.locator('input[placeholder="Please Enter Your Email"]').first()).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]:has-text("Login")')).toBeVisible();
  });
});

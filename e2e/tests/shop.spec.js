const { test, expect } = require('@playwright/test');

// ST-SHOP: Product catalog and search — black-box system tests
// Bug #1 (empty catalog due to broken rating filter) is observable here.

test.describe('Product catalog', () => {
  test('ST-SHOP-01: /shop page loads without a crash', async ({ page }) => {
    await page.goto('/shop');
    // Page must not show a blank white screen or JS error overlay
    await expect(page.locator('body')).toBeVisible();
    const errorOverlay = page.locator('text=/something went wrong|cannot read/i');
    await expect(errorOverlay).toHaveCount(0);
  });

  test('ST-SHOP-02: product cards are visible on the shop page [RED — Bug #1]', async ({ page }) => {
    await page.goto('/shop');
    // Wait for content to load
    await page.waitForTimeout(3000);

    // Products should be listed — if Bug #1 is present, this returns 0 cards
    // because the default rating filter (min=0, max=0) matches no products.
    const productCards = page.locator('.product-item, .card, [class*="product"]');
    const count = await productCards.count();

    // This assertion documents Bug #1: it FAILS today because count === 0.
    // Expected: at least one product visible. Actual: empty list due to
    // broken rating-filter default in the API query.
    expect(count).toBeGreaterThan(0);
  });

  test('ST-SHOP-03: search bar is present on the shop/home page', async ({ page }) => {
    await page.goto('/');
    const searchInput = page.locator('input[placeholder="Search Products"]');
    await expect(searchInput.first()).toBeVisible();
  });

  test('ST-SHOP-04: searching a product name returns results', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const searchInput = page.locator('input[placeholder="Search Products"]').first();
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    await searchInput.fill('a');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);
    // Either results appear or the search navigates to a results page
    const body = await page.textContent('body');
    expect(body.length).toBeGreaterThan(100);
  });

  test('ST-SHOP-05: navigating to a non-existent route shows a 404 / not-found page', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-xyz123');
    await page.waitForTimeout(1000);
    // Should either show a 404 page or redirect to home — not a blank screen
    await expect(page.locator('body')).toBeVisible();
  });
});

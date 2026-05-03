import { test } from '@playwright/test';

test('capture screenshots for README', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('[data-testid="overlay-menu"]');
  await page.screenshot({ path: 'docs/screenshot-menu.png', fullPage: false });
  await page.getByTestId('start-btn').click();
  await page.waitForTimeout(200);
  // Make some moves so the board has activity
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Space');
  await page.waitForTimeout(50);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Space');
  await page.waitForTimeout(50);
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Space');
  await page.waitForTimeout(50);
  await page.keyboard.press('c');
  await page.waitForTimeout(50);
  await page.screenshot({ path: 'docs/screenshot-game.png', fullPage: false });
});

import { test, expect } from '@playwright/test';

test.describe('Tetris game', () => {
  test('shows menu, starts, plays, pauses, scores', async ({ page }) => {
    await page.goto('/');

    // Menu visible
    await expect(page.getByTestId('overlay-menu')).toBeVisible();
    await expect(page.getByText('TETRIS')).toBeVisible();

    // Start
    await page.getByTestId('start-btn').click();
    await expect(page.getByTestId('overlay-menu')).not.toBeVisible();

    // Make sure board has cells rendered
    await expect(page.locator('.board .cell').first()).toBeVisible();

    // Play a few moves
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowUp'); // rotate

    // Hard drop
    const scoreEl = page.getByTestId('score');
    await page.keyboard.press('Space');
    await page.waitForTimeout(50);
    const scoreAfter = parseInt((await scoreEl.textContent()) ?? '0', 10);
    expect(scoreAfter).toBeGreaterThan(0);

    // Hard drop a few more times
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Space');
      await page.waitForTimeout(20);
    }

    // Pause
    await page.keyboard.press('p');
    await expect(page.getByTestId('overlay-pause')).toBeVisible();

    // Resume
    await page.keyboard.press('p');
    await expect(page.getByTestId('overlay-pause')).not.toBeVisible();

    // Hold
    await page.keyboard.press('c');
  });
});

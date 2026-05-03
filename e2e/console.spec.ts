import { test, expect } from '@playwright/test';

test('no console errors during gameplay', async ({ page }) => {
  const messages: { type: string; text: string }[] = [];
  page.on('console', (msg) => messages.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', (err) => messages.push({ type: 'pageerror', text: err.message }));

  await page.goto('/');
  await page.getByTestId('start-btn').click();
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Space');
    await page.waitForTimeout(20);
  }
  await page.keyboard.press('p');
  await page.waitForTimeout(50);
  await page.keyboard.press('p');

  const errors = messages.filter(
    (m) => m.type === 'error' || m.type === 'pageerror' || m.type === 'warning'
  );
  if (errors.length > 0) {
    console.log('Console issues:', errors);
  }
  expect(errors).toEqual([]);
});

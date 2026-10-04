import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * A first visit, end to end, in a real browser: the intro, the spoiler prompt, sailing the
 * timeline, and an island's panel. Then the same by keyboard alone, and an automated
 * accessibility scan (axe) of each screen. Early arcs are used throughout, since new episodes
 * never change them.
 */

/** Opens the app as a first-time viewer, skips the intro, and returns the spoiler prompt. */
async function arriveAsNewViewer(page: Page) {
  await page.goto('/');
  const skipIntro = page.getByRole('button', { name: 'Skip intro' });
  await expect(skipIntro).toBeVisible();
  await page.keyboard.press('Escape'); // any key skips it
  await expect(skipIntro).toBeHidden();

  const gate = page.getByRole('dialog', { name: 'Where are you in the story?' });
  await expect(gate).toBeVisible();
  return gate;
}

/**
 * axe's findings, as rule ids and the elements that break them, so a failure reads as a list.
 * It waits for fades to finish first: text caught mid-fade would fail the contrast check.
 */
async function axeViolations(page: Page) {
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
      .every((animation) => animation.playState !== 'running'),
  );
  const { violations } = await new AxeBuilder({ page }).analyze();
  return violations.map(
    ({ id, nodes }) => `${id}: ${nodes.map(({ target }) => target.join(' ')).join(', ')}`,
  );
}

test('a first visit: skip the intro, sail three arcs, open an island', async ({ page }) => {
  const gate = await arriveAsNewViewer(page);
  await gate.getByRole('button', { name: /caught up/ }).click();
  await expect(gate).toBeHidden();

  const next = page.getByRole('button', { name: 'Next arc' });
  for (let i = 0; i < 3; i++) await next.click();
  await expect(page).toHaveURL(/\?arc=baratie$/);
  await expect(page.getByRole('slider', { name: 'Story arc' })).toHaveAttribute(
    'aria-valuetext',
    /^Baratie Arc, /,
  );

  await page.getByRole('button', { name: 'Baratie, this arc' }).click();
  await expect(page.getByRole('heading', { name: 'Baratie', exact: true })).toBeFocused();
  await expect(page.getByRole('link', { name: /Read more on the wiki/ })).toBeVisible();
  await expect(page).toHaveURL(/\?arc=baratie$/);
});

test('by keyboard alone, inside a spoiler limit', async ({ page }) => {
  await arriveAsNewViewer(page);
  // The episode field has focus: answer, then come back as a returning viewer.
  await page.keyboard.type('100');
  await page.keyboard.press('Enter');
  await page.reload();

  // The page has loaded, but React may not have rendered it yet.
  const skipLink = page.getByRole('link', { name: 'Skip to the timeline' });
  await expect(skipLink).toBeAttached();
  await page.keyboard.press('Tab');
  await expect(skipLink).toBeFocused();
  await page.keyboard.press('Enter');
  const slider = page.getByRole('slider', { name: 'Story arc' });
  await expect(slider).toBeFocused();
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/\?arc=baratie$/);

  // Back through the timeline's controls and the map to the island.
  const island = page.getByRole('button', { name: 'Baratie, this arc' });
  for (let i = 0; i < 60 && !(await island.evaluate((el) => el === document.activeElement)); i++) {
    await page.keyboard.press('Shift+Tab');
  }
  await expect(island).toBeFocused();
  await expect(island).toBeInViewport();
  // Islands past the limit aren't on the map at all, so they aren't in the Tab order either.
  await expect(page.getByRole('button', { name: /^Water 7,/ })).toHaveCount(0);

  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Baratie', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Baratie', exact: true })).toBeHidden();
  await expect(island).toBeFocused();
});

test('no accessibility problems axe can detect, on any screen', async ({ page }) => {
  const gate = await arriveAsNewViewer(page);
  expect(await axeViolations(page)).toEqual([]);

  await gate.getByRole('button', { name: /caught up/ }).click();
  await page.getByRole('button', { name: 'Foosha Village, this arc' }).click();
  await expect(page.getByRole('heading', { name: 'Foosha Village', exact: true })).toBeFocused();
  expect(await axeViolations(page)).toEqual([]);

  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  expect(await axeViolations(page)).toEqual([]);
});

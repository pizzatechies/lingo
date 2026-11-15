/**
 * End-to-end smoke test against a running Lugha server (default http://localhost:8787).
 * Usage: npm run build && npm start   (in another terminal)  then: npm run test:e2e [url] [screenshotDir]
 */
const { chromium } = require('playwright');
const assert = require('node:assert');

(async () => {
  const url = process.argv[2] || 'http://localhost:8787/';
  const shots = process.argv[3];
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  const shot = async (name) => shots && p.screenshot({ path: `${shots}/${name}.png` });
  const step = (m) => console.log('•', m);

  step('onboarding');
  await p.goto(url);
  await p.click('text=Get started');
  await p.click('text=Kiswahili');
  await p.click('text=Continue');
  await p.click('text=Skip');
  await p.click('text=Continue');
  await p.fill('input', 'Tester');
  await p.click('text=Start from scratch');
  await p.waitForSelector('.bead.current');
  await shot('e2e-learn');

  step('play a full lesson (skipping answers, solving matches by trial)');
  await p.click('.bead.current');
  await p.click('text=Start +10 XP');
  for (let i = 0; i < 80; i++) {
    await p.waitForTimeout(120);
    if (await p.locator('text=Lesson complete!').count()) break;
    if (await p.locator('button:has-text("Got it")').count()) { await p.click('button:has-text("Got it")'); continue; }
    if (await p.locator('.match').count()) {
      const left = p.locator('.match .stack').nth(0).locator('.tile:not(.gone)');
      while (await left.count()) {
        await left.first().click();
        const rights = p.locator('.match .stack').nth(1).locator('.tile:not(.gone)');
        const n = await rights.count();
        for (let j = 0; j < n; j++) {
          await rights.nth(j).click();
          await p.waitForTimeout(80);
          if (!(await p.locator('.match .stack').nth(0).locator('.tile[aria-pressed="true"]').count())) {
            if (await left.count() && (await left.count()) < n) break;
          }
          await left.first().click().catch(() => {});
        }
        await p.waitForTimeout(500);
      }
      continue;
    }
    if (await p.locator('button:has-text("Continue")').count()) { await p.click('button:has-text("Continue")'); continue; }
    if (await p.locator('button:has-text("Skip")').count()) { await p.click('button:has-text("Skip")'); continue; }
  }
  await p.waitForSelector('text=Lesson complete!', { timeout: 5000 });
  await shot('e2e-complete');
  await p.click('button:has-text("Continue")');
  await p.waitForSelector('.bead.done');

  step('explore: dictionary, proverbs, story list');
  await p.click('nav >> text=Explore');
  await p.click('text=Dictionary');
  await p.fill('input', 'water');
  await p.waitForSelector('text=maji');
  await p.click('text=← Explore');
  await p.click('text=Methali');
  await p.waitForSelector('text=Haba na haba hujaza kibaba.');

  step('practice hub');
  await p.click('nav >> text=Practice');
  await p.waitForSelector('text=Smart review');

  step('sign up and open leagues');
  await p.click('nav >> text=Leagues');
  await p.fill('input[placeholder="Username"]', 'e2e_' + Date.now().toString(36).slice(-6));
  await p.fill('input[type="password"]', 'password123');
  await p.click('form button[type=submit]');
  await p.waitForSelector('text=🏅 League', { timeout: 8000 });
  await p.waitForSelector('.lb-row', { timeout: 8000 });
  await p.waitForTimeout(800);
  await shot('e2e-league');
  const standings = await p.locator('.lb-row').count();
  assert.ok(standings >= 1, 'should appear in the league after syncing lesson XP');

  step('create a Harambee team');
  await p.click('text=🤝 Harambee');
  await p.fill('input[placeholder^="Team name"]', 'Timu ya Majaribio');
  await p.click('button:has-text("Create")');
  await p.waitForSelector('text=Code:');
  await shot('e2e-team');

  step('community page');
  await p.goto(url + '#/community');
  await p.waitForSelector('text=Community');
  await shot('e2e-community');

  assert.deepStrictEqual(errors, [], 'no page errors');
  console.log('✅ e2e smoke test passed');
  await b.close();
})().catch((e) => { console.error('❌', e); process.exit(1); });

import { chromium } from 'playwright-core';

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--no-sandbox'],
});

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const issues = [];
  const responses = { map: 0, terrain: 0, buildings: 0 };
  const mapLevels = new Set();

  page.on('pageerror', (error) => issues.push(`page: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') issues.push(`console: ${message.text()}`);
  });
  page.on('response', (response) => {
    const url = response.url();
    if (url.includes('wmts.geo.admin.ch') && response.ok()) {
      responses.map++;
      const level = url.match(/\/3857\/(\d+)\//)?.[1];
      if (level) mapLevels.add(Number(level));
    }
    if (url.includes('ch.swisstopo.terrain.3d') && response.ok()) responses.terrain++;
    if (url.includes('ch.swisstopo.swissbuildings3d.3d') && response.ok()) responses.buildings++;
    if (response.status() >= 400) issues.push(`HTTP ${response.status()}: ${url}`);
  });
  page.on('requestfailed', (request) => {
    if (request.failure()?.errorText === 'net::ERR_ABORTED') return;
    issues.push(`request: ${request.failure()?.errorText} ${request.url()}`);
  });

  const probeUrl = new URL(process.env.JURA3D_URL ?? 'http://127.0.0.1:5173/');
  probeUrl.searchParams.set('probe', '1');
  await page.goto(probeUrl.href, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelector('#status')?.textContent === 'Scène 3D prête.', undefined, { timeout: 30000 });
  await page.screenshot({ path: 'probe-delémont.png', fullPage: true });
  const status = await page.locator('#status').textContent();
  await page.locator('#datetime').fill('2026-12-21T09:00');
  await page.locator('#datetime').dispatchEvent('change');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'probe-hiver.png', fullPage: true });
  await page.locator('#buildings').uncheck();
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'probe-sans-batiments.png', fullPage: true });
  await page.locator('#buildings').check();
  await page.locator('#datetime').fill('2026-06-21T16:00');
  await page.locator('#datetime').dispatchEvent('change');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'probe-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  const slider = page.locator('#time-slider');
  const setSlider = (minutes) => slider.evaluate((element, value) => {
    element.value = String(value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }, minutes);
  await setSlider(0);
  await page.waitForTimeout(500);
  const midnight = await page.evaluate(() => ({
    label: document.querySelector('#time-value').value,
    datetime: document.querySelector('#datetime').value,
    clock: window.__jura3dCamera().time,
  }));
  await page.screenshot({ path: 'probe-nuit.png', fullPage: true });
  await setSlider(720);
  await page.waitForTimeout(500);
  const midday = await page.evaluate(() => ({
    label: document.querySelector('#time-value').value,
    datetime: document.querySelector('#datetime').value,
    clock: window.__jura3dCamera().time,
  }));
  await page.screenshot({ path: 'probe-midi.png', fullPage: true });
  if (midnight.label !== '00:00' || midday.label !== '12:00') issues.push('slider label did not update');
  if (!midnight.datetime.endsWith('T00:00') || !midday.datetime.endsWith('T12:00')) issues.push('slider and datetime are out of sync');
  if (midnight.clock === midday.clock) issues.push('slider did not update Cesium clock');
  if (await page.evaluate(() => window.__jura3dCamera().imageryMaximumLevel) !== 20) issues.push('aerial imagery is not available through level 20');
  const cameraBefore = await page.evaluate(() => window.__jura3dCamera());
  const canvas = page.locator('#cesiumContainer canvas').first();
  const box = await canvas.boundingBox();
  const startX = box.x + box.width * 0.6;
  const startY = box.y + box.height * 0.55;
  await page.mouse.move(startX, startY);
  await page.mouse.down({ button: 'right' });
  await page.mouse.move(startX + 180, startY, { steps: 20 });
  await page.mouse.up({ button: 'right' });
  await page.waitForTimeout(700);
  const cameraAfterOrbit = await page.evaluate(() => window.__jura3dCamera());
  await page.mouse.move(startX, startY);
  await page.mouse.down({ button: 'right' });
  await page.mouse.move(startX, startY + 100, { steps: 15 });
  await page.mouse.up({ button: 'right' });
  await page.waitForTimeout(700);
  const cameraAfterTilt = await page.evaluate(() => window.__jura3dCamera());
  await page.mouse.wheel(0, -400);
  await page.waitForTimeout(700);
  const cameraAfterWheel = await page.evaluate(() => window.__jura3dCamera());
  await page.mouse.wheel(0, -400);
  await page.waitForTimeout(1000);
  const cameraClose = await page.evaluate(() => window.__jura3dCamera());
  const headingChange = Math.abs(cameraAfterOrbit.heading - cameraBefore.heading);
  const pitchChange = Math.abs(cameraAfterTilt.pitch - cameraAfterOrbit.pitch);
  const wheelHeightChange = Math.abs(cameraAfterWheel.height - cameraAfterTilt.height);
  if (headingChange < 0.02) issues.push(`right drag did not orbit: ${headingChange}`);
  if (pitchChange < 0.02) issues.push(`right drag did not tilt: ${pitchChange}`);
  if (wheelHeightChange < 10) issues.push(`wheel did not zoom: ${wheelHeightChange}`);
  console.log(JSON.stringify({ status, responses, mapLevels: [...mapLevels].sort((a, b) => a - b), midnight, midday, cameraBefore, cameraAfterOrbit, cameraAfterTilt, cameraAfterWheel, cameraClose, issues: issues.slice(0, 20) }, null, 2));
  if (issues.length || responses.map === 0 || responses.terrain === 0 || responses.buildings < 3) {
    process.exitCode = 1;
  }
} finally {
  await browser.close();
}

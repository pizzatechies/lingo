/**
 * Renders PNG app icons and Android launcher icons / splash screens from public/icons/*.svg.
 * Run after `python3 scripts/make-logo.py` (and `npx cap add android`): node scripts/render-icons.cjs
 * Needs Playwright with Chromium.
 */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const icon = fs.readFileSync(path.join(root, 'public/icons/icon.svg'), 'utf8');
const mark = fs.readFileSync(path.join(root, 'public/icons/logo-mark.svg'), 'utf8');
const ptLogo = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(root, 'public/brand/pizza-technologies.jpg')).toString('base64');
const credit = (px) => `<span style="display:inline-flex;align-items:center;gap:${px * 0.5}px"><img src="${ptLogo}" style="width:${px * 1.8}px;height:${px * 1.8}px;border-radius:22%"/>by <b>Pizza Technologies</b></span>`;
const res = path.join(root, 'android/app/src/main/res');
const dims = (f) => { const b = fs.readFileSync(f); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
const sized = (svg, w) => svg.replace('<svg ', `<svg width="${w}" height="${w}" `);

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  const render = async (file, w, h, html, transparent) => {
    await p.setViewportSize({ width: w, height: h });
    await p.setContent(`<html><body style="margin:0;width:${w}px;height:${h}px;overflow:hidden">${html}</body></html>`);
    await p.screenshot({ path: file, omitBackground: !!transparent });
  };
  for (const s of [192, 512]) await render(path.join(root, `public/icons/icon-${s}.png`), s, s, sized(icon, s), true);
  if (fs.existsSync(res)) {
    for (const d of fs.readdirSync(res)) {
      for (const f of fs.readdirSync(path.join(res, d))) {
        const file = path.join(res, d, f);
        if (!f.endsWith('.png')) continue;
        const [w, h] = dims(file);
        const m = Math.min(w, h);
        if (f === 'ic_launcher.png') await render(file, w, h, sized(icon, w), true);
        else if (f === 'ic_launcher_round.png') await render(file, w, h, `<div style="width:${w}px;height:${w}px;border-radius:50%;background:#D9541E;display:grid;place-items:center">${sized(mark, w * 0.86)}</div>`, true);
        // Adaptive icon foreground: keep the mark inside the 66% safe zone.
        else if (f === 'ic_launcher_foreground.png') await render(file, w, h, `<div style="width:${w}px;height:${w}px;display:grid;place-items:center">${sized(mark, w * 0.62)}</div>`, true);
        else if (f === 'splash.png') await render(file, w, h, `<div style="width:${w}px;height:${h}px;background:#FFF8F0;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${m * 0.04}px;font-family:sans-serif">${sized(icon, m * 0.34)}<div style="font-weight:900;font-size:${m * 0.085}px;color:#D9541E">Lugha Zetu</div><div style="position:absolute;bottom:${m * 0.08}px;font-size:${m * 0.032}px;color:#7A6455">${credit(m * 0.032)}</div></div>`);
      }
    }
  }
  // iOS: the App Store icon must be a full-bleed, opaque square (iOS rounds the corners itself).
  const ios = path.join(root, 'ios/App/App/Assets.xcassets');
  if (fs.existsSync(ios)) {
    await render(path.join(ios, 'AppIcon.appiconset/AppIcon-512@2x.png'), 1024, 1024, `<div style="width:1024px;height:1024px;background:#D9541E;display:grid;place-items:center">${sized(mark, 1024 * 0.76)}</div>`);
    const m = 2732;
    const splash = `<div style="width:${m}px;height:${m}px;background:#FFF8F0;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${m * 0.03}px;font-family:sans-serif">${sized(icon, m * 0.2)}<div style="font-weight:900;font-size:${m * 0.05}px;color:#D9541E">Lugha Zetu</div><div style="position:absolute;bottom:${m * 0.3}px;font-size:${m * 0.018}px;color:#7A6455">${credit(m * 0.02)}</div></div>`;
    for (const f of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) await render(path.join(ios, 'Splash.imageset', f), m, m, splash);
  }
  await b.close();
  console.log('icons rendered');
})();

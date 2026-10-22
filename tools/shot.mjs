/**
 * Full-page screenshots via the Chrome DevTools Protocol.
 *
 * Why not simpler tools:
 *  - The in-app browser pane can't repaint while it's hidden.
 *  - `chrome --headless --screenshot` only captures the viewport, and forcing a
 *    tall window breaks the hero, which is sized in svh.
 *
 * CDP's captureBeyondViewport keeps the layout viewport at the real size (so
 * 100svh stays one screen) while capturing the whole document.
 *
 *   node tools/shot.mjs <url> <out.png> [width] [height] [--reduced-motion]
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const [url, out, w = '1440', h = '900'] = process.argv.slice(2);
const reduced = process.argv.includes('--reduced-motion');
if (!url || !out) { console.error('usage: shot.mjs <url> <out.png> [w] [h]'); process.exit(2); }

const port = 9222 + Math.floor(Math.random() * 500);
const profile = mkdtempSync(join(tmpdir(), 'lnf-shot-'));
const chrome = spawn(CHROME, [
  '--headless', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
  '--mute-audio', `--user-data-dir=${profile}`, `--remote-debugging-port=${port}`,
  'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cleanup = () => {
  try { chrome.kill('SIGKILL'); } catch {}
  // Chrome can still be flushing its profile when we get here, which makes rm
  // throw ENOTEMPTY *after* the screenshot already succeeded. maxRetries rides
  // that out, and a failure to tidy a temp dir must never fail the capture.
  try { rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 120 }); } catch {}
};

try {
  // wait for the debugger to come up
  let ws;
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/version`);
      ws = (await r.json()).webSocketDebuggerUrl;
      if (ws) break;
    } catch {}
    await sleep(150);
  }
  if (!ws) throw new Error('chrome debugger never came up');

  const tab = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  const sock = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((res, rej) => { sock.onopen = res; sock.onerror = rej; });

  let id = 0;
  const pending = new Map();
  const events = [];
  sock.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result); pending.delete(msg.id); }
    else if (msg.method) events.push(msg.method);
  };
  const send = (method, params = {}) =>
    new Promise((res) => { const i = ++id; pending.set(i, res); sock.send(JSON.stringify({ id: i, method, params })); });

  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: +w, height: +h, deviceScaleFactor: 1, mobile: false,
  });
  if (reduced) {
    await send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    });
  }

  await send('Page.navigate', { url });
  for (let i = 0; i < 80 && !events.includes('Page.loadEventFired'); i++) await sleep(100);
  await sleep(1200); // let fonts settle and lazy images below the fold decode

  // full document height, then capture past the viewport
  const { result } = await send('Runtime.evaluate', {
    expression: `(()=>{
      document.querySelectorAll('img[loading=lazy]').forEach(i=>i.loading='eager');
      // Astro's dev toolbar floats over the bottom of every capture.
      document.querySelectorAll('astro-dev-toolbar').forEach(t=>t.remove());
      return document.documentElement.scrollHeight;
    })()`,
    returnByValue: true,
  });
  // Flipping loading=lazy to eager only *starts* the fetch. captureBeyondViewport
  // will happily shoot a region whose images have not decoded yet, which reads as
  // "the image is missing" when it is simply not painted. Wait for each one.
  await send('Runtime.evaluate', { awaitPromise: true, expression:
    "Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))" });
  await sleep(600);

  const shot = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
    clip: { x: 0, y: 0, width: +w, height: result.value, scale: 1 },
  });
  writeFileSync(out, Buffer.from(shot.data, 'base64'));
  console.log(`${out}  ${w}x${result.value}`);
} finally {
  cleanup();
}

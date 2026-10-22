/**
 * Scripted check of a page in headless Chrome, over the DevTools Protocol.
 * Runs a list of steps (JS, file uploads, taps, waits, viewport screenshots)
 * and reports POST responses and page errors at the end.
 *
 *   node tools/probe.mjs <url> <w> <h> <out-prefix> <steps.json> [--mobile]
 *
 * steps.json is an array of:
 *   { "js": "expression" }            evaluated in the page (awaited, value printed)
 *   { "files": { "selector": "#id", "paths": ["/abs/file.jpg"] } }
 *   { "tap": "css selector", "noscroll": true }   a real pointer tap/click
 *   { "wait": ms }  { "shot": true }   (combinable in one step, run in that order)
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const [url, w, h, prefix, stepsFile] = process.argv.slice(2);
const mobile = process.argv.includes('--mobile');
if (!stepsFile) { console.error('usage: probe.mjs <url> <w> <h> <out-prefix> <steps.json> [--mobile]'); process.exit(2); }
const steps = JSON.parse(readFileSync(stepsFile, 'utf8'));

const port = 9300 + Math.floor(Math.random() * 400);
const profile = mkdtempSync(join(tmpdir(), 'lnf-probe-'));
const chrome = spawn(CHROME, ['--headless', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
  `--user-data-dir=${profile}`, `--remote-debugging-port=${port}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  for (let i = 0; i < 60; i++) {
    try { if ((await (await fetch(`http://127.0.0.1:${port}/json/version`)).json()).webSocketDebuggerUrl) break; } catch {}
    await sleep(150);
  }
  const tab = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  const sock = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((r) => (sock.onopen = r));

  let id = 0;
  const pending = new Map();
  const events = [];
  sock.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result || msg.error); pending.delete(msg.id); }
    else if (msg.method) events.push(msg);
  };
  const send = (method, params = {}) =>
    new Promise((res) => { const i = ++id; pending.set(i, res); sock.send(JSON.stringify({ id: i, method, params })); });

  await send('Page.enable'); await send('Runtime.enable'); await send('DOM.enable'); await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: mobile ? 2 : 1, mobile });
  if (mobile) await send('Emulation.setTouchEmulationEnabled', { enabled: true });
  await send('Page.navigate', { url });
  for (let i = 0; i < 120 && !events.some((e) => e.method === 'Page.loadEventFired'); i++) await sleep(100);
  await sleep(1500);

  let n = 0;
  for (const s of steps) {
    if (s.files) {
      const doc = await send('DOM.getDocument');
      const q = await send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: s.files.selector });
      await send('DOM.setFileInputFiles', { nodeId: q.nodeId, files: s.files.paths });
    }
    if (s.tap) {
      const r = await send('Runtime.evaluate', { returnByValue: true, expression: `(()=>{
        const e=document.querySelector(${JSON.stringify(s.tap)});
        ${s.noscroll ? '' : "e.scrollIntoView({block:'center',behavior:'instant'});"}
        const b=e.getBoundingClientRect(); return [b.x+b.width/2,b.y+b.height/2]})()` });
      const [x, y] = r.result.value;
      await sleep(100);
      if (mobile) {
        await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
        await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      } else {
        await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
        await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
      }
    }
    if (s.js) {
      const r = await send('Runtime.evaluate', { expression: s.js, awaitPromise: true, returnByValue: true });
      console.log('>', JSON.stringify(r.result?.value ?? r.exceptionDetails?.exception?.description ?? r));
    }
    if (s.wait) await sleep(s.wait);
    if (s.shot) {
      const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
      writeFileSync(`${prefix}-${++n}.jpg`, Buffer.from(shot.data, 'base64'));
      console.log('shot', `${prefix}-${n}.jpg`);
    }
  }

  const postIds = new Set(events.filter((e) => e.method === 'Network.requestWillBeSent' && e.params.request.method === 'POST').map((e) => e.params.requestId));
  events.filter((e) => e.method === 'Network.responseReceived' && postIds.has(e.params.requestId))
    .forEach((e) => console.log('POST response', e.params.response.status, e.params.response.url));
  const errs = events.filter((e) => e.method === 'Runtime.exceptionThrown');
  if (errs.length) console.log('PAGE ERRORS', errs.map((e) => e.params.exceptionDetails?.exception?.description).join(' | '));
} finally {
  try { chrome.kill('SIGKILL'); } catch {}
  try { rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 120 }); } catch {}
}

/** Verification pass: overflow, reduced-motion behaviour, transfer weight, a11y basics. */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL_ = process.argv[2] || 'http://localhost:4399/';
const port = 9700 + Math.floor(Math.random() * 200);
const profile = mkdtempSync(join(tmpdir(), 'lnf-check-'));
const chrome = spawn(CHROME, ['--headless','--disable-gpu','--hide-scrollbars','--no-first-run',
  '--mute-audio',`--user-data-dir=${profile}`,`--remote-debugging-port=${port}`,'about:blank'],{stdio:'ignore'});
const sleep = ms => new Promise(r=>setTimeout(r,ms));

async function session({ width, height, reduced }) {
  const tab = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`,{method:'PUT'})).json();
  const sock = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((res,rej)=>{sock.onopen=res;sock.onerror=rej;});
  let id=0; const pending=new Map(); const net=[];
  sock.onmessage = m => { const msg=JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result); pending.delete(msg.id); }
    else if (msg.method==='Network.responseReceived') net.push({id:msg.params.requestId, url:msg.params.response.url, type:msg.params.type, len:0});
    else if (msg.method==='Network.loadingFinished') {
      const l=net.find(n=>n.id===msg.params.requestId);   // correlate by requestId, not by order
      if (l) l.len=msg.params.encodedDataLength;
    }
  };
  const send=(method,params={})=>new Promise(res=>{const i=++id;pending.set(i,res);sock.send(JSON.stringify({id:i,method,params}));});
  await send('Page.enable'); await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<700});
  if (reduced) await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await send('Page.navigate',{url:URL_});
  await sleep(3500);
  return { send, net, close: () => sock.close() };
}

try {
  for (let i=0;i<60;i++){ try{ const r=await fetch(`http://127.0.0.1:${port}/json/version`); if((await r.json()).webSocketDebuggerUrl) break; }catch{} await sleep(150); }

  for (const w of [375, 390, 768, 1024, 1440, 1920]) {
    const s = await session({ width: w, height: 900, reduced: false });
    const { result } = await s.send('Runtime.evaluate', { returnByValue: true, expression: `(()=>{
      // Compare against the width asked for, not clientWidth: in mobile
      // emulation an overflowing element widens the layout viewport itself, so
      // clientWidth grows with it and the overflow cancels out of the check.
      const de=document.documentElement, W=${w};
      const over=[...document.querySelectorAll('body *')]
        .filter(e=>{const r=e.getBoundingClientRect(); return r.right > W+1;})
        .slice(0,4).map(e=>e.tagName+'.'+(e.className&&e.className.baseVal===undefined?String(e.className).split(' ')[0]:''));
      return { scrollW: de.scrollWidth, clientW: de.clientWidth, overflow: de.scrollWidth>W+1, offenders: over };
    })()` });
    console.log(`w=${String(w).padEnd(5)} overflow=${result.value.overflow}  scrollW=${result.value.scrollW}` +
                (result.value.overflow ? `  offenders=${JSON.stringify(result.value.offenders)}` : ''));
    s.close();
  }

  // reduced motion must not fetch any video.
  // Pages without a hero are the normal case now, so this reports on whatever
  // videos the page actually has rather than assuming #heroVideo exists.
  for (const reduced of [false, true]) {
    const s = await session({ width: 1440, height: 900, reduced });
    const vids = s.net.filter(n => /\.(mp4|webm)$/.test(n.url));
    const { result } = await s.send('Runtime.evaluate', { returnByValue: true, expression:
      `(()=>[...document.querySelectorAll('video')].map(v=>({
         id: v.id || v.className || 'video',
         sources: v.querySelectorAll('source').length,
         paused: v.paused,
       })))()` });
    const vs = result.value ?? [];
    const summary = vs.length
      ? vs.map(v => `${v.id}[src:${v.sources} ${v.paused ? 'paused' : 'playing'}]`).join(' ')
      : 'no <video> on page';
    console.log(`reduced-motion=${String(reduced).padEnd(5)} videoRequests=${vids.length}  ${summary}`);
    s.close();
  }

  // cold-load weight, desktop
  {
    const s = await session({ width: 1440, height: 900, reduced: false });
    await sleep(3000);
    // CDP's encodedDataLength comes back 0 here, so read the Resource Timing API instead.
    const { result } = await s.send('Runtime.evaluate', { returnByValue: true, expression: `(()=>{
      const rs = performance.getEntriesByType('resource');
      const nav = performance.getEntriesByType('navigation')[0];
      const by = {};
      for (const r of rs) {
        const k = r.initiatorType === 'css' ? 'font/css-asset' : r.initiatorType;
        by[k] = (by[k]||0) + (r.transferSize || r.encodedBodySize || 0);
      }
      const total = rs.reduce((a,r)=>a+(r.transferSize||r.encodedBodySize||0),0) + (nav?nav.transferSize:0);
      const lcp = performance.getEntriesByType('largest-contentful-paint').slice(-1)[0];
      return { total, count: rs.length, by,
               fcp: (performance.getEntriesByName('first-contentful-paint')[0]||{}).startTime,
               domContentLoaded: nav && nav.domContentLoadedEventEnd };
    })()` });
    const v = result.value;
    console.log(`\ncold desktop load: ${(v.total/1024).toFixed(0)} KB across ${v.count+1} requests`);
    for (const [k,b] of Object.entries(v.by).sort((a,b)=>b[1]-a[1])) console.log(`   ${String(k).padEnd(14)} ${(b/1024).toFixed(0)} KB`);
    console.log(`   FCP ${v.fcp?.toFixed(0)}ms   DOMContentLoaded ${v.domContentLoaded?.toFixed(0)}ms`);
    s.close();
  }

  // a11y basics
  {
    const s = await session({ width: 1440, height: 900, reduced: false });
    const { result } = await s.send('Runtime.evaluate', { returnByValue: true, expression: `(()=>{
      const imgs=[...document.querySelectorAll('img')];
      return {
        imgsMissingAlt: imgs.filter(i=>i.getAttribute('alt')===null).length,
        imgsNoDims: imgs.filter(i=>!i.getAttribute('width')||!i.getAttribute('height')).length,
        h1: document.querySelectorAll('h1').length,
        headingOrder: [...document.querySelectorAll('h1,h2,h3')].map(h=>h.tagName).join(','),
        lang: document.documentElement.lang,
        skipLink: !!document.querySelector('.skip'),
        landmarks: ['header','main','footer','nav'].map(t=>t+':'+document.querySelectorAll(t).length).join(' '),
      };})()` });
    console.log('\na11y:', JSON.stringify(result.value, null, 1));
    s.close();
  }
} finally {
  chrome.kill('SIGKILL'); rmSync(profile,{recursive:true,force:true});
}

#!/usr/bin/env bash
# Love & Flour — still-image prep.
# Camera originals are 6000px / 13–27MB each. Astro's sharp pipeline can read them
# but it's needlessly slow at build time, so we pre-flatten to 2400px masters here
# and let astro:assets emit the responsive AVIF/WebP variants from those.
set -euo pipefail
cd "$(dirname "$0")/.."

OUT="src/assets/img"
mkdir -p "$OUT/cakes"

node <<'NODE'
const sharp = require('sharp');
const OUT = 'src/assets/img';

const jobs = [
  // Story band — frosting the chocolate cake. Already warm; just resize.
  { src: 'Assorted Images/DSC08196.jpg', out: `${OUT}/frosting.jpg`, w: 2400 },

  // Pastries lane — rows of pan de bono. Already warm; just resize.
  { src: 'Assorted Images/DSC08236.jpg', out: `${OUT}/pan-de-bono.jpg`, w: 2400 },

  // Our Story — the Cafecito neon. Portrait 9:16 out of camera; the page crops it
  // to 4:5, so this keeps the full width and plenty of vertical headroom.
  { src: 'cafecito.jpg', out: `${OUT}/cafecito.jpg`, w: 1600 },

  // Visit Us — pouring a cafecito, in a branded polo.
  { src: 'coffee.jpg', out: `${OUT}/coffee.jpg`, w: 1600 },

  // About — the exterior blade sign. Wide open sky on the right, so it takes a
  // banner crop at any aspect without losing the sign.
  { src: 'sign.jpg', out: `${OUT}/sign.jpg`, w: 2400 },

  // Menu — golden loaves, beside the page header. Shallow focus: only the
  // upper rows are sharp, so the page frames on those.
  { src: 'Extra Images/DSC08308.jpg', out: `${OUT}/bread.jpg`, w: 2400 },

  // Menu — sprinkle buns, the lead-in to Granizadas. The tighter of the two
  // sprinkle frames (DSC08319 is a near-duplicate, unused).
  { src: 'Extra Images/DSC08324.jpg', out: `${OUT}/sprinkles.jpg`, w: 2400 },

  // Menu — a strawberry licuado wearing the shop's own sticker, outside.
  { src: 'Extra Images/DSC08207.jpg', out: `${OUT}/licuado.jpg`, w: 1600 },

  // Order Cakes — Vanessa's own "transport your cake with care" graphics.
  // Circles on a white square; the page clips them to the circle.
  { src: 'cake delivery images/98391E26-3BEE-4B92-9015-6577D787EECB.PNG', out: `${OUT}/transport-en.jpg`, w: 1100, q: 90 },
  { src: 'cake delivery images/spanish.PNG', out: `${OUT}/transport-es.jpg`, w: 1100, q: 90 },

  // Kept for reference / possible later use — interior. Shot under flat fluorescent light, so this one gets a
  // warm grade to bring it toward the rest of the page.
  //
  // NB: do NOT use sharp's .tint() here — it converts to greyscale before
  // tinting, which drains every bit of colour out of the shot. Warmth comes from
  // a per-channel linear instead: lift red, hold green, pull blue down.
  {
    src: 'Assorted Images/DSC08066-HDR.jpg', out: `${OUT}/interior.jpg`, w: 2400,
    grade: img => img
      .modulate({ saturation: 1.22, brightness: 1.03 })
      .linear([1.06, 1.0, 0.93], [-6, -3, 3]),
  },
];

(async () => {
  for (const j of jobs) {
    let img = sharp(j.src).resize({ width: j.w, withoutEnlargement: true });
    if (j.grade) img = j.grade(img);
    const info = await img.jpeg({ quality: j.q ?? 86, mozjpeg: true }).toFile(j.out);
    console.log(`${j.out}  ${info.width}x${info.height}  ${(info.size/1024|0)}KB`);
  }

  // Social preview for /about. 1200x630 is the size Facebook, iMessage, WhatsApp
  // and Slack all crop to; generating it explicitly beats letting them crop a
  // 2400px still badly.
  {
    const info = await sharp('sign.jpg')
      .resize({ width: 1200, height: 630, fit: 'cover', position: sharp.strategy.attention })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile('public/og-sign.jpg');
    console.log(`public/og-sign.jpg  ${info.width}x${info.height}  ${(info.size/1024|0)}KB`);
  }

  // Logo — Vanessa's new badge (Oct 2026), replacing the original one. Kept as
  // a PNG for its transparent corners. Also the favicon and the iPhone
  // home-screen icon (that one flattened: iOS fills transparency with black).
  {
    const L = await sharp('new_logo.PNG').resize({ width: 600 }).png({ compressionLevel: 9 }).toFile(`${OUT}/logo.png`);
    console.log(`${OUT}/logo.png  ${L.width}x${L.height}  ${(L.size/1024|0)}KB`);
    await sharp('new_logo.PNG').resize(32, 32).png().toFile('public/favicon-32.png');
    await sharp('new_logo.PNG').resize(180, 180).flatten({ background: '#FDF8F4' }).png().toFile('public/apple-touch-icon.png');
    console.log('public/favicon-32.png, public/apple-touch-icon.png');
  }

  // Menu — the breakfast plate, cut out (the file is misnamed
  // "cafecito.jpg.png"). Kept as a cutout so it sits on a blush panel with the
  // same alpha drop-shadow as the cakes, rather than as a tight photo of a
  // countertop.
  {
    const out = await sharp('Extra Images/cafecito.jpg.png', { limitInputPixels: false })
      .trim({ threshold: 1 })
      .resize({ width: 1800 })
      .png({ compressionLevel: 9, palette: false })
      .toFile(`${OUT}/breakfast-plate.png`);
    console.log(`${OUT}/breakfast-plate.png  ${out.width}x${out.height}  ${(out.size/1024|0)}KB`);
  }

  // Cakes — the edited, already-cut-out set in `all cake images/` (one per
  // flavor on the order page; the home grid reuses four of them).
  //
  // Trim the transparent margin, then fit each into the same 1200x1000 frame
  // anchored to the BOTTOM edge. Every cake ends up the same width (or the same
  // height, for the few taller than the frame's ratio) and sits on a shared
  // baseline, so a row of them lines up on the plate rather than floating at
  // different heights. Keys are the flavor ids in src/data/cakes.ts.
  //
  // flan_traditional.png is deliberately not here: Flan was taken off the
  // price list (see docs/questions-for-vanessa.md).
  const SRC = 'all cake images';
  const cakes = {
    'tres-leches':          'tresleche.png',
    'strawberry':           'strawberry.png',
    'neapolitan':           'napilotano.png',
    'cappuccino':           'cappuchino.png',
    'mocha':                'mocha.png',
    'red-velvet':           'redvelvet.png',
    'chocolate-vanilla':    'Chocolate_Vanilla.png',
    'symphony':             'sinfonia.png',
    'triple-chocolate':     'triplechocolate.png',
    'caramel':              'caramel.png',
    'carrot':               'Carrot Cake.png',
    'black-forest':         'Black Forest.png',
    'angels-kiss':          'angel cake.png',
    'tiramisu':             'tiramisu.png',
    'mango':                'mango.png',
    'oreo':                 'Oreo.png',
    'chocolate-strawberry': 'chocostrawberry.png',
  };
  for (const [c, file] of Object.entries(cakes)) {
    const info = await sharp(`${SRC}/${file}`, { limitInputPixels: false })
      .trim({ threshold: 1 })
      .resize({ width: 1200, height: 1000, fit: 'contain', position: 'bottom',
                background: { r:0, g:0, b:0, alpha:0 } })
      .png({ compressionLevel: 9, palette: false })
      .toFile(`${OUT}/cakes/${c}.png`);
    console.log(`${OUT}/cakes/${c}.png  ${info.width}x${info.height}  ${(info.size/1024|0)}KB`);
  }
})();
NODE

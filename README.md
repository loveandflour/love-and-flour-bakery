# Love & Flour Bakery — website

Landing page (phase 1) for Love & Flour Bakery, Silver Spring MD.
Astro → static HTML, deployed on Netlify from GitHub.

## Running it

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # -> dist/
```

## What's built

Phase 1 is the landing page only. The nav ships complete — **Menu · Online Order ·
Order Cakes · About · Contact** — so the remaining pages inherit it unchanged, but
today only *Online Order* resolves (straight out to Clover). The other four routes
404 until phase 2.

Sections: hero (video) → Our Story → What we bake → cake showcase → Visit us → footer.

## What's in the repo

Code plus the **derived** web assets — `src/assets/img/` and `public/video/` are
committed, so a fresh clone builds and deploys with no extra files. Verified: a
clean clone runs `npm install && npm run build` and produces `dist/`.

Raw camera masters stay out. They run well over a gigabyte and nothing reads them
at deploy time — only the scripts in `tools/` do. Keep these on the drive next to
the repo if you need to regenerate assets:

| File | Used by |
|---|---|
| `HEROREEL2.mov` | `tools/encode-hero.sh` |
| `GradedShots00850637.mov` | `tools/encode-pour.sh` |
| `Assorted Images/`, `cafecito.jpg`, `coffee.jpg` | `tools/prep-images.sh` |
| `cake grid images/`, `chocostrawberry_removebg.png` | `tools/matte.swift` + `prep-images.sh` |

One gitignore gotcha worth knowing: those rules are **anchored with a leading
slash**. Unanchored, `coffee.jpg` would also swallow `src/assets/img/coffee.jpg`,
which is meant to be tracked.

## Pages

`/` (landing) and `/about`. The nav ships all five items; Menu, Order Cakes and
Contact still 404.

**`Base.astro` takes `hasHero`, and it defaults to `false`.** Only the landing
page passes it. That default is load-bearing — a page that opts out gets a nav
rendered solid by the server and a `<main>` padded clear of the fixed bar. Both
were real bugs the moment a second page existed: the nav used to render
transparent-with-white-text and only correct itself once a client script ran,
which on a cream page is white text on near-white, and unpadded content slid
under the fixed nav. New pages inherit the safe behaviour without doing anything.

`ogImage` is a prop too, so a page can set its own social preview; the hero
poster preload now only fires on the page that actually has the hero.

## Design system

Everything colour-related is sampled from the real logo badge, not invented.
See `src/styles/tokens.css`:

| Token | Hex | Where it came from |
|---|---|---|
| `--blush` | `#FFB3C7` | the logo's pink circle — 41% of its pixels |
| `--brand-red` | `#AE0000` | the script wordmark and heart |
| `--brand-red-deep` | `#6C0006` | the darkest tone inside the mark |
| `--ground` | `#FDF8F4` | the one warm off-white ground |
| `--ink` | `#3B241B` | body copy — dark brown, never pure black |

`--brand-red` is spent **only** on the Order button and the heart in the divider.
Don't spread it around decoratively.

Type is **Archivo** (headings/UI) against **Newsreader** (body), both self-hosted
variable fonts. The logo's script is never reproduced as a webfont — no cursive
face is loaded anywhere on the site.

The signature element is `FlourishRule.astro`: the heart-and-swirl from the logo,
redrawn as an inline SVG divider.

## Business facts

All of it lives in `src/site.ts` — address, phone, hours, Clover URL, nav.
Change it there, not in the templates.

> **Unresolved:** the old Wix site contradicts itself. Its footer says
> (301) 433-2105 with Mon–Thu 5a–9p; its Contact page says (240) 847-7974 with
> Mon–Thu 5a–7p. `site.ts` uses the client-confirmed footer values. Needs
> settling with Vanessa before launch. (The old site's Sunday hours also had a
> typo — "8:am - 800pm" — corrected here.)

## Asset pipeline

Camera originals (`HEROREEL*.mov`, `GradedShots*.mov`, `Assorted Images/`, `cake grid images/`) are
gitignored — 272 MB of source that must never reach the deploy. The scripts in
`tools/` turn them into what ships:

| Script | What it does |
|---|---|
| `tools/encode-hero.sh` | Cuts two shots out of the reel, crossfades them into a seamless 16.8s loop, emits 1080p + 720p MP4/WebM and a poster |
| `tools/encode-pour.sh` | Cuts the milk pour out of `GradedShots00850637.mov`, crops it 4:5, loops it to 7s, emits 880px + 616px MP4/WebM and a poster |
| `tools/matte.swift` | Removes the pale blue studio backdrop from the cake photos using Vision's `VNGenerateForegroundInstanceMaskRequest` |
| `tools/prep-images.sh` | Resizes/grades the stills, trims and pads the matted cakes |
| `tools/shot.mjs` | Full-page screenshots over CDP |
| `tools/check.mjs` | Overflow, reduced-motion, transfer weight, a11y checks |

Rebuild assets with:

```bash
./tools/encode-hero.sh
./tools/encode-pour.sh
swiftc -O tools/matte.swift -o tools/build/matte
for f in tools/build/cakes/*.png; do tools/build/matte "$f" "${f%.png}-matte.png"; done
./tools/prep-images.sh
```

### Two traps worth remembering

- **Don't use sharp's `.tint()` to warm a photo.** It greyscales first, which
  drained all the colour out of the interior shot. Warmth comes from a
  per-channel `.linear()` instead.
- **`aspect-ratio` loses to the `height` attribute** Astro emits on `<Image>`.
  Any image with a CSS aspect ratio also needs `height: auto`.

## Hero video

A **17-second, two-shot loop**: the pan dulce shaping (shot A) dissolving into
the spiral mixer (shot D) and back again.

Why two shots — shot A never returns to its starting state. The camera drifts
right and the tray fills with topped conchas as it runs, so there is no frame
late in the shot that matches an early one. Measured against a noise floor of
8.2, the best possible hard cut still scores 23.7. Cutting to a second shot makes
the loop point a deliberate dissolve rather than a visible jump, and shot D's
motion is cyclical so it carries the turnaround. The clip ends on the frame
immediately before its first, which is what closes the loop.

**Dimming lives in CSS, not the encode.** `--hero-dim` on `.hero` (currently
`0.45`) is a flat black layer — the footage at reduced opacity over black. That's
a linear multiply, so shadow detail and tonal relationships survive. An earlier
version baked a curves grade into the encode and crushed the blacks into mud.
To retune the darkness, change that one number; no re-encode needed.

There are two loop videos: the hero, and the pour in the Visit section
(`LoopVideo.astro`). Both use `preload="none"` with `<source>` elements attached
by script rather than markup so that:

- `prefers-reduced-motion: reduce` gets the poster still and downloads **no video at all**
- phones get the smaller encode of each, never the desktop one

The coffee loop additionally only loads and plays once it scrolls into view, and
pauses when it leaves — it sits well below the fold, so autoplaying on load would
decode video nobody is looking at. The hero keeps its own copy of this logic
because it has to start immediately instead.

Video weight over a full scroll: **2.16 MB** desktop, **1.14 MB** mobile, none of
it on the critical path.

### Why the coffee loop is two shots

A single shot can't loop here: the cup fills as it pours, so the last frame never
matches the first. The usual fix — dissolving the tail back onto the head — hides
the mismatch but reads as a mushy fade, which is exactly what it looks like.

So the clip is two shots: **steaming the milk at the machine, then pouring it
into the glass**, joined by a hard cut, in that order because that's the order it
happens. Every transition in the loop is now a cut between two different shots,
including the one where it restarts — an edit rather than a glitch. There are no
fades in this clip at all.

The in/out points matter as much as the shots. A first attempt ran the steam shot
out while the gold pitcher still filled the left of frame, straight into a pour
shot where the gold pitcher also filled the left of frame: same object, same
place, slightly different size, which reads as a botched zoom rather than a cut.
The steam shot now ends on the machine's chrome group heads with the pitcher
dropped to the bottom edge, and the pour starts once milk is visibly in the glass.

(The rest of the requested 1:13–1:35 range is skipped deliberately: an espresso
pour from a steel pitcher at 1:13–1:18, the barista turning away to fetch milk at
1:19–1:21, and the glass lifted out of frame at 1:32.)

### Grain, not shake

The hero shimmer reads as camera shake. Mostly it isn't — it's sensor grain.
Worth recording, because the obvious diagnosis is wrong and costs a day:

- A whole-frame motion estimate reports ~47px of jitter. That estimate is
  garbage: the baker's hands are large and fast enough to drag it with them. The
  hand region of the frame reports 3.7x the motion the static tray region does.
- Measured in genuinely static blocks, apparent motion is **1–2px**.

The source is now `HEROREEL2.mov`, a stabilised export of the same reel. It is
worth having, but not for the reason you'd expect — it removes only ~12% of the
frame-to-frame difference on its own. The real gain is that **temporal denoising
works far better on stable footage**, because the denoiser can average across
frames when the content holds still. The two compound:

| | mean abs Δ per pixel (static strip) |
|---|---|
| original reel, no denoise | 1.734 |
| stabilised reel, no denoise | 1.521 |
| stabilised + `hqdn3d=5:5:4:4` (shipped) | **0.686** |

That is a 60% reduction overall, against 28% from denoise alone.

The weight sits on the **spatial** terms deliberately. hqdn3d's temporal pass
averages across frames, so it ghosts fast motion — at temporal strength 9 and
above the black glove visibly goes translucent against the counter. Spatial
denoising cannot ghost. `nlmeans` was tested too: 3% better, 9x slower, not worth
it. The denoise also pays for itself in bitrate, taking the 1080p WebM from
~2.5 MB to 1.4 MB.

## Measured

No horizontal overflow at 375/390/768/1024/1440/1920. Contrast measured against
the **brightest frame of the loop**, with the text hidden so only the real
background is sampled — worst single pixel behind each element:

| Element | Contrast | Needs |
|---|---|---|
| h1 (white, large) | 6.5:1 | 4.5:1 |
| kicker (blush, small) | 5.1:1 | 4.5:1 |
| "order a cake" link | 9.6:1 | 4.5:1 |
| nav links (white) | 18.2:1 | 4.5:1 |

The kicker is the tightest of these — if `--hero-dim` is ever lowered, re-check it.

## Still needed

- High-res logo source (current file is a 408px web copy — fine at nav size, not larger)
- Real menu items and prices, pulled manually from Clover
- The custom-cake lead-time policy, to state as one plain sentence on Order Cakes
- Resolve the phone/hours contradiction above
- Spanish copy exists on the old site and is captured; structure allows adding it later

/**
 * Single source of truth for business facts.
 *
 * PHONE — settled. The old Wix site contradicted itself: its footer said
 * (301) 433-2105 and its Contact page said (240) 847-7974. We use 301
 * everywhere, because three independent sources agree on it — Google's business
 * listing, the Wix footer, and a poster printed and hung inside the shop. The
 * 240 number appears nowhere except that one Wix page. Still worth confirming
 * with Vanessa that it is genuinely dead before the old site comes down.
 *
 * HOURS — the same page disagreed here too (Mon–Thu 5a–7p vs 5a–9p). The values
 * below are the client-confirmed ones. The old site also had a typo in the
 * Sunday hours ("8:am - 800pm"), fixed here.
 *
 * EMAIL — note the domain differs from the website's. bakeryloveflour.com has
 * live Google Workspace MX records; loveandflourmd.com has no MX at all. When
 * the website domain is repointed from Wix to Netlify, leave bakeryloveflour.com
 * alone — there is no mail on the website domain to break.
 */

export const BIZ = {
  name: 'Love & Flour Bakery',
  tagline: 'Taste the Love, Every Time.',
  street: '8202 Piney Branch Rd.',
  city: 'Silver Spring',
  state: 'MD',
  zip: '20910',
  phone: '(301) 433-2105',
  phoneHref: 'tel:+13014332105',
  email: 'shop@bakeryloveflour.com',
  /*
   * Two different links on purpose.
   *
   * `maps` is the bakery's own Google listing, addressed by its CID. A plain
   * `?q=<address>` search — which is what this used to be — drops a pin on the
   * address without attaching it to the business, and Street View can land on
   * the opposite side of Piney Branch, which reads as the wrong place.
   * The CID comes from the listing's own Maps URL and is stable; the long
   * /maps/place/... URLs Google hands you carry `entry=` and `g_ep=` session
   * tokens that go stale, so don't paste one of those in here.
   *
   * `directions` uses Google's documented Maps URLs API and opens routing
   * straight away, resolving the destination by name + address.
   */
  maps: 'https://maps.google.com/?cid=5690189179664398607',
  directions:
    'https://www.google.com/maps/dir/?api=1&destination=' +
    encodeURIComponent('Love & Flour Bakery Panaderia, 8202 Piney Branch Rd, Silver Spring, MD 20910'),
  established: 2023,
} as const;

/** `short` is for the compact footer summary; `days` for the full table. */
export const HOURS = [
  { days: 'Monday – Thursday', short: 'Mon–Thu', time: '5:00am – 9:00pm' },
  { days: 'Friday – Saturday', short: 'Fri–Sat', time: '5:00am – 10:00pm' },
  { days: 'Sunday',            short: 'Sun',     time: '8:00am – 8:00pm' },
] as const;

/** Bread, pastries and drinks check out instantly on Clover. Cakes never do. */
export const CLOVER =
  'https://love-flour-bakery-silver-spring.cloveronline.com/menu/all';

/**
 * The full five-item nav ships now so the remaining pages inherit it unchanged.
 * Only "Online Order" resolves today — the other four 404 until phase 2.
 */
export const NAV = [
  { label: 'Menu',        href: '/menu' },
  { label: 'Online Order', href: CLOVER, external: true },
  { label: 'Order Cakes', href: '/order-cakes' },
  { label: 'About',       href: '/about' },
  { label: 'Contact',     href: '/contact' },
] as const;

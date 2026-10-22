/* ===========================================================================
   Cakes — the single source of truth for the Order Cakes page and the home
   page cake grid.

   Prices are from Vanessa's own price sheet ("L&F Cake Prices.xlsx", Oct 2026).
   They are shown on the site only as ESTIMATES: every cake is confirmed by
   phone before anyone pays, so nothing here is a checkout price.

   Availability rule: a flavor comes only in the round sizes it has a price for.
   Double height follows the same sizes. Sheets are offered only where the
   sheet has a price for that flavor. Anything else can still be requested, but
   it is sent as a custom request with no estimate. Open questions about this
   live in docs/questions-for-vanessa.md.
   =========================================================================== */
import type { ImageMetadata } from 'astro';

import tresLeches from '../assets/img/cakes/tres-leches.png';
import strawberry from '../assets/img/cakes/strawberry.png';
import neapolitan from '../assets/img/cakes/neapolitan.png';
import cappuccino from '../assets/img/cakes/cappuccino.png';
import mocha from '../assets/img/cakes/mocha.png';
import redVelvet from '../assets/img/cakes/red-velvet.png';
import chocolateVanilla from '../assets/img/cakes/chocolate-vanilla.png';
import symphony from '../assets/img/cakes/symphony.png';
import tripleChocolate from '../assets/img/cakes/triple-chocolate.png';
import caramel from '../assets/img/cakes/caramel.png';
import carrot from '../assets/img/cakes/carrot.png';
import blackForest from '../assets/img/cakes/black-forest.png';
import angelsKiss from '../assets/img/cakes/angels-kiss.png';
import tiramisu from '../assets/img/cakes/tiramisu.png';
import mango from '../assets/img/cakes/mango.png';
import oreo from '../assets/img/cakes/oreo.png';
import chocolateStrawberry from '../assets/img/cakes/chocolate-strawberry.png';

/** Days of notice a cake needs. PLACEHOLDER: confirm with Vanessa. */
export const LEAD_DAYS = 5;

export type RoundSize = '6' | '8' | '10' | '12';
export type SheetSize = 'small' | 'medium' | 'large';

export const ROUND_SIZES: RoundSize[] = ['6', '8', '10', '12'];

/** Double height ("high") cakes: twice as tall, priced by size only. */
export const HIGH: Record<RoundSize, number> = { 6: 78.95, 8: 96.95, 10: 145, 12: 185 };

/** Rectangular sheet cakes. A full sheet is the bakery's whole baking tray.
    Clover also lists a "mini" sheet ($32.95, serves 4–6). It's left off the site
    until Vanessa says what it is: it overlaps the small rounds and isn't a
    fraction of the tray like the others (docs/questions-for-vanessa.md). */
export const SHEETS: { id: SheetSize; label: string; what: string; serves: string; price: number }[] = [
  { id: 'small',  label: 'Quarter sheet', what: 'a quarter tray',      serves: '14–16',  price: 68.95 },
  { id: 'medium', label: 'Half sheet',    what: 'half a baking tray',  serves: '40–45',  price: 128.5 },
  { id: 'large',  label: 'Full sheet',    what: 'a whole baking tray', serves: '80–100', price: 198.6 },
];

export interface Flavor {
  id: string;
  name: string;
  /** Only where her price sheet says what's in it — no invented descriptions. */
  note?: string;
  img: ImageMetadata | null;
  round: Partial<Record<RoundSize, number>>;
  /** 'all' = every sheet at the standard price; an object = its own prices. */
  sheet?: 'all' | Partial<Record<SheetSize, number>>;
}

/* In the order of her price sheet. */
export const FLAVORS: Flavor[] = [
  { id: 'tres-leches', name: 'Tres Leches', img: tresLeches,
    round: { 6: 29.95, 8: 39.95, 10: 49.95, 12: 96.5 } },
  { id: 'strawberry', name: 'Strawberry', img: strawberry,
    round: { 6: 29.95, 8: 39.95, 10: 49.95 } },
  { id: 'neapolitan', name: 'Neapolitan', img: neapolitan,
    round: { 6: 35.95, 8: 45.95, 10: 52.95, 12: 98.5 } },
  { id: 'cappuccino', name: 'Cappuccino', img: cappuccino,
    round: { 6: 29.95, 8: 39.95, 10: 49.95 } },
  { id: 'mocha', name: 'Mocha', img: mocha,
    round: { 6: 29.95, 8: 39.95, 10: 49.95, 12: 96.5 } },
  { id: 'red-velvet', name: 'Red Velvet', img: redVelvet,
    round: { 6: 30.95, 8: 40.95, 10: 50.95, 12: 96.5 } },
  { id: 'chocolate-vanilla', name: 'Chocolate-Vanilla', img: chocolateVanilla,
    round: { 6: 29.95, 8: 39.95, 10: 49.95 } },
  { id: 'symphony', name: 'Symphony', note: 'Caramel, red velvet and chocolate', img: symphony,
    round: { 6: 29.95, 8: 39.95, 10: 49.95 } },
  { id: 'triple-chocolate', name: 'Triple Chocolate', img: tripleChocolate,
    round: { 6: 31.95, 8: 40.95, 10: 54.95 } },
  { id: 'caramel', name: 'Caramel Syrup', img: caramel,
    round: { 6: 29.95, 8: 39.95 } },
  { id: 'carrot', name: 'Carrot Cream Cheese', img: carrot,
    round: { 8: 41.95, 10: 51.95 } },
  { id: 'black-forest', name: 'Black Forest', img: blackForest,
    round: { 6: 31.95, 8: 41.95, 10: 51.95 } },
  { id: 'angels-kiss', name: "Angel's Kiss", note: 'Tres leches with flan', img: angelsKiss,
    round: { 8: 42.95, 10: 52.95 }, sheet: { medium: 128.95, large: 225 } },
  { id: 'tiramisu', name: 'Tiramisu', note: 'With mascarpone', img: tiramisu,
    round: { 6: 30.95, 8: 42.5, 10: 55.5 } },
  { id: 'mango', name: 'Mango Mousse', img: mango,
    round: { 8: 42.95, 10: 55.95 } },
  { id: 'oreo', name: 'Oreo', img: oreo,
    round: { 6: 29.95, 10: 49.95 } },
  { id: 'chocolate-strawberry', name: 'Chocolate-Strawberry', note: 'Chocolate cake, strawberry filling',
    img: chocolateStrawberry, round: { 8: 39.95 } },

  /* No photo — the simple option, common for office parties. Prices are the
     old Clover "Vanilla" row; it was taken off the new sheet. Confirm. */
  { id: 'vanilla', name: 'Plain vanilla', note: 'Simple and classic. Good for offices and parties.',
    img: null, round: { 6: 29.95, 8: 39.95, 10: 49.95, 12: 96.5 }, sheet: 'all' },
];

/** The four cakes on the home page, in order. */
export const HOME_CAKES = ['strawberry', 'angels-kiss', 'chocolate-strawberry', 'mango'];

export const flavorById = (id: string) => FLAVORS.find((f) => f.id === id);

/** Lowest estimate for a flavor, across every size it comes in. */
export function fromPrice(f: Flavor): number {
  const prices = Object.values(f.round) as number[];
  if (f.sheet === 'all') prices.push(...SHEETS.map((s) => s.price));
  else if (f.sheet) prices.push(...(Object.values(f.sheet) as number[]));
  return Math.min(...prices);
}

export const money = (n: number) => `$${n.toFixed(2)}`;

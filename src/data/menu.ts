/* ===========================================================================
   Menu — the single source of truth for /menu.

   Transcribed from Vanessa's five printed menus (in MENUS/, not shipped):
   breakfast, the kitchen, hot coffee, specialty coffee, and granizadas.
   Every price was read from 2x zoomed crops and checked against the full poster.

   Dish names stay as she wrote them. The English descriptions are drawn from
   her Spanish ones and need her review; see docs/questions-for-vanessa.md.
   Left out on purpose: the summer combos ("Combos del Verano") and pastries
   (no printed menu lists them yet).

   To change a price, edit the number here. Nothing else needs touching.
   =========================================================================== */

export interface Option { label: string; price: number }

export interface Item {
  name: string;
  desc?: string;
  /** One price. */
  price?: number;
  /** One price per size, lined up with the group's `sizes`. */
  prices?: number[];
  /** A few priced variants of the same dish (3 or 4 tacos, chicken or beef). */
  options?: Option[];
  /** An add-on: shown as "+$3.50". */
  add?: boolean;
  /** Priced per piece: shown with "each". */
  each?: boolean;
  /** A small label beside the name. */
  tag?: string;
}

export interface Group {
  title: string;
  /** Column headers for sized drinks, e.g. ['12 oz', '16 oz']. */
  sizes?: string[];
  note?: string;
  items: Item[];
  /** Short unpriced lists, e.g. granizada flavors. */
  lines?: { label: string; text: string }[];
}

export interface Section {
  id: string;
  /** Label in the jump bar. */
  nav: string;
  title: string;
  /** Her Spanish name for the section, shown small above the title. */
  es: string;
  intro?: string;
  groups: Group[];
}

export const MENU: Section[] = [
  /* ----------------------------------------------------------------- */
  {
    id: 'breakfast',
    nav: 'Breakfast',
    title: 'Breakfast',
    es: 'Desayunos',
    // Her line: "Desayunos frescos preparados al momento".
    intro: 'Fresh breakfasts, made to order.',
    groups: [
      {
        title: 'Breakfast combos',
        items: [
          { name: 'Chapín Power', price: 17.49,
            desc: 'Desayuno Ranchero Chapín with hot coffee and a natural juice.' },
          { name: 'Sweet Breakfast', price: 17.99,
            desc: '2 pancakes, eggs and bacon, with a 16 oz fresco (jamaica, mango or horchata) or hot coffee.' },
        ],
      },
      {
        title: "Chef's favorites",
        items: [
          { name: 'Chilaquiles Divorciados', price: 14.99,
            desc: 'Beef and eggs with red and green chilaquiles.' },
          { name: 'Baleadas Especiales de la Casa',
            desc: 'With beans, crema and cheese.',
            options: [
              { label: 'Chicken or chorizo', price: 12.95 },
              { label: 'Beef', price: 14.5 },
            ] },
          { name: 'Desayuno Ranchero Chapín', price: 14.49,
            desc: 'Huevos rancheros, beans, plantains and crema.' },
        ],
      },
      {
        title: 'Traditional breakfasts',
        items: [
          { name: 'Desayuno Clásico', price: 12.99,
            desc: 'Sausage in tomato sauce, beans, scrambled eggs, crema and cheese, with 2 tortillas.' },
          { name: 'Desayuno con Carne Asada', price: 18.99,
            desc: 'Grilled steak, beans, scrambled eggs, crema and cheese, with 2 tortillas.' },
          { name: 'Desayuno con Chorizo', price: 14.49,
            desc: 'Chorizo, beans, scrambled eggs, crema and cheese, with 2 tortillas.' },
        ],
      },
      {
        title: 'Croissants, bagels & crepes',
        items: [
          { name: 'Croissant Breakfast Sandwich', price: 7.85,
            desc: 'With ham, egg or cheese.' },
          { name: 'Bagel Sandwich', price: 8.75,
            desc: 'Ham or bacon with lettuce, tomato, cheese and egg.' },
          { name: 'Crepas Dulces Supreme', price: 11.49,
            desc: 'Nutella, strawberries, blueberries and banana.' },
        ],
      },
      {
        title: 'Add to your breakfast',
        items: [
          { name: 'Coffee', price: 2.75 },
          { name: 'Smoothie (34 oz)', price: 6.95 },
          { name: 'Extra meat', price: 8.5 },
          { name: 'Make it a combo', price: 2.49, add: true,
            desc: 'Add coffee or juice to any breakfast.' },
        ],
      },
    ],
  },

  /* ----------------------------------------------------------------- */
  {
    id: 'kitchen',
    nav: 'Hot Entrees',
    title: 'Hot and made to order',
    es: 'Platos principales',
    groups: [
      {
        title: 'Tacos & quesadillas',
        items: [
          { name: '3 Tacos de Carne, Pollo o Chorizo', price: 15.5,
            desc: 'Beef, chicken or chorizo.' },
          { name: '3 Tacos de Birria', price: 15.5 },
          { name: 'Tacos al Pastor',
            desc: 'Marinated pork, pineapple, onion and cilantro.',
            options: [
              { label: '3 tacos', price: 13.95 },
              { label: '4 tacos', price: 17.95 },
            ] },
          { name: 'Quesadilla de Pollo', price: 12.5, desc: 'Chicken, with fries.' },
          { name: 'Quesadilla de Chorizo', price: 12.5, desc: 'Chorizo, with fries.' },
          { name: 'Quesadilla de Carne', price: 14.5, desc: 'Beef, with fries.' },
        ],
      },
      {
        title: 'Tortas Mexicanas',
        note: 'Every torta comes as a combo with fresh-cut fries.',
        items: [
          { name: 'Torta de Birria', price: 16.5 },
          { name: 'Torta de Pollo', price: 13.95 },
          { name: 'Torta de Chorizo', price: 13.95 },
          { name: 'Torta de Carne', price: 15.5 },
          { name: 'Torta Mixta', price: 17.5 },
        ],
      },
      {
        title: 'Entrees',
        items: [
          { name: 'Hamburguesa de la Casa', price: 15.5,
            desc: 'Hamburger on a bun, served with lettuce, tomato, onion and house dressing, with fries.' },
          { name: 'Pechuga Asada', price: 16.5,
            desc: 'Grilled chicken breast with fries, salad, beans, 2 tortillas, hot sauce and curtido.' },
          { name: 'Carne Asada', price: 20.95,
            desc: 'Grilled steak with fries, salad, beans, 2 tortillas, hot sauce and curtido.' },
          { name: 'Churrasco Mixto', price: 23.95,
            desc: 'Grilled steak, grilled chicken, chorizo, potatoes, beans, 2 tortillas and cheese.' },
          { name: 'Chicharrones con Frijoles', price: 14.5, tag: 'New',
            desc: 'With 3 tortillas, cheese, curtido and hot sauce.' },
        ],
      },
      {
        title: 'Snacks',
        items: [
          { name: 'Plátanos con Crema', price: 5.5, desc: 'Plantains with crema.' },
          { name: 'Papas Locas', price: 7.25 },
          { name: 'Yuca con Chicharrón', price: 8.25 },
          { name: 'Panqueques', price: 8.5, desc: 'Pancakes on their own.' },
        ],
      },
      {
        title: 'Tamales & chuchitos chapines',
        items: [
          { name: 'Tamales', price: 10, desc: 'Three tamales.' },
          { name: 'Tamal de Elote', price: 3.75, each: true, desc: 'Sweet corn tamal.' },
          { name: 'Chuchitos Chapines', price: 3.75, each: true,
            desc: 'Chicken, pork, chicken with jalapeño, or vegetable.' },
        ],
      },
      {
        title: 'Add to your order',
        items: [
          { name: 'Papas Fritas Naturales', price: 3.5, add: true, desc: 'Fresh-cut fries.' },
          { name: 'Fresco Natural Pequeño', price: 4, add: true, desc: 'A small fresh drink.' },
        ],
      },
    ],
  },

  /* ----------------------------------------------------------------- */
  {
    id: 'coffee',
    nav: 'Coffee',
    title: 'Coffee',
    es: 'Café',
    groups: [
      {
        title: 'Coffee & espresso',
        sizes: ['12 oz', '16 oz'],
        items: [
          { name: 'Café Regular', prices: [2.75, 3.25], desc: 'Smooth and classic.' },
          { name: 'Decaf', prices: [2.85, 3.35], desc: 'All the flavor, no caffeine.' },
          { name: 'Latte', prices: [4.25, 4.95], desc: 'Espresso with creamy milk and a little foam.' },
          { name: 'Cappuccino', prices: [4.25, 4.95], desc: 'Espresso with steamed milk and creamy foam.' },
          { name: 'Mocha', prices: [4.75, 5.5], desc: 'Espresso with chocolate and steamed milk.' },
          { name: 'Espresso', prices: [2.25, 2.75], desc: 'Intense, strong and full of flavor.' },
          { name: 'Double Espresso', prices: [3.25, 3.75], desc: 'Double the intensity.' },
        ],
      },
      {
        title: 'More hot drinks',
        items: [
          { name: 'Café con Leche', price: 3.25 },
          { name: 'Chocolate Caliente', price: 3.75, desc: 'Hot chocolate.' },
          { name: 'Té', price: 2.75, desc: 'Tea.' },
        ],
      },
    ],
  },

  /* ----------------------------------------------------------------- */
  {
    id: 'specialty',
    nav: 'Specialty coffee',
    title: 'Specialty coffee',
    es: 'Cafés premium',
    intro: 'Lattes come iced or hot. Frappés are blended.',
    groups: [
      {
        title: 'Lattes, frappés & cold brew',
        sizes: ['16 oz', '20 oz'],
        items: [
          { name: 'Caramel Latte', prices: [5.95, 6.95], desc: 'Espresso with creamy milk and caramel.' },
          { name: 'Mocha Clásico', prices: [5.95, 6.95], desc: 'Espresso, chocolate and frothed milk.' },
          { name: 'Caramel Macchiato', prices: [5.75, 6.75], desc: 'Steamed milk with a shot of espresso and house caramel.' },
          { name: 'Vanilla Latte', prices: [5.75, 6.95], desc: 'Espresso with creamy milk and Madagascar vanilla.' },
          { name: 'Hazelnut Latte', prices: [5.75, 6.75], desc: 'Espresso with creamy milk and hazelnut.' },
          { name: 'Cold Brew con Crema', prices: [5.95, 6.95], desc: 'Slow-steeped cold brew with sweet crema and a touch of vanilla.' },
          { name: 'Cookies & Cream Frappé', prices: [6.25, 7.25], desc: 'Blended coffee with Oreo, crema and a touch of chocolate.' },
          { name: 'White Chocolate Frappé', prices: [6.25, 7.25], desc: 'Blended coffee, white chocolate and milk.' },
        ],
      },
      {
        title: 'Coffee & something sweet',
        note: 'Each with a medium drink.',
        items: [
          { name: 'Combo Clásico', price: 7.95, desc: 'Latte and a plain croissant.' },
          { name: 'Combo Energía', price: 7.95, desc: 'Mocha Clásico and a glazed donut.' },
          { name: 'Combo Dulce', price: 8.45, desc: 'Caramel Macchiato and a mini vanilla-strawberry cake.' },
          { name: 'Combo Tres Leches', price: 8.45, desc: 'Any coffee and a slice of tres leches.' },
          { name: 'Combo Pudín', price: 8.45, desc: 'Cold brew and homemade pudding.' },
          { name: 'Combo Donas', price: 7.95, desc: 'Vanilla Latte and a chocolate donut.' },
        ],
      },
    ],
  },

  /* ----------------------------------------------------------------- */
  {
    id: 'smoothies',
    nav: 'Smoothies',
    title: 'Smoothies & juice',
    es: 'Smoothies naturales',
    groups: [
      {
        title: 'Fresh',
        items: [
          { name: 'Smoothie Natural (34 oz)', price: 6.95,
            desc: 'Strawberry, mango, banana, strawberry-banana or papaya.' },
          { name: 'Jugo de Naranja Natural (16 oz)', price: 8.5,
            desc: 'Fresh-squeezed orange juice.' },
        ],
      },
    ],
  },

  /* ----------------------------------------------------------------- */
  {
    id: 'granizadas',
    nav: 'Granizadas',
    title: 'Granizadas',
    es: 'Granizadas locas',
    intro: 'Shaved ice with your choice of syrup, made your way.',
    groups: [
      {
        title: 'Classics',
        items: [
          { name: 'Básica', price: 5, desc: 'With the syrup of your choice.' },
          { name: 'Limón Natural', price: 5, desc: 'Fresh lime. Classic and refreshing.' },
          { name: 'Limón Preparada', price: 9.95, desc: 'Lime with the house touch: pepita, chili and chips.' },
        ],
      },
      {
        title: 'Made your way',
        items: [
          { name: 'Granizada con Fruta Natural', price: 9.95,
            desc: 'Your favorite syrup with fresh pineapple, tamarind, strawberry, coconut or mango.' },
          { name: 'Jarritos Preparados', price: 10,
            desc: 'With Tajín, chamoy, gummies, lime and the Jarritos flavor of your choice.' },
        ],
        lines: [
          { label: 'Syrups', text: 'Strawberry, pineapple, mango, tamarind and more.' },
          { label: 'Extras', text: 'Chamoy, Tajín, gummies, extra fruit, condensed milk, extra lime.' },
        ],
      },
    ],
  },
];

export const money = (n: number) => `$${n.toFixed(2)}`;

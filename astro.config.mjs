import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://loveandflourmd.com',
  image: {
    // Sharp handles the 6000px sources; these are the widths we actually emit.
    responsiveStyles: true,
  },
  build: { inlineStylesheets: 'auto' },
});

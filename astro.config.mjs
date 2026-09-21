// @ts-check
import { defineConfig } from 'astro/config';

import preact from '@astrojs/preact';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { resolveSiteUrl } from './src/lib/seo/site.ts';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  site: resolveSiteUrl(),
  integrations: [
    preact(),
    sitemap({
      // Only active, indexable pages plus the global (non-locale) homepage
      // should be sitemapped. Everything the registry marks planned,
      // coming-soon, or disabled is never built in the first place, so it
      // can't leak in here — this filter additionally excludes the 404 page.
      filter: (page) => !page.endsWith('/404') && !page.endsWith('/404/'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});

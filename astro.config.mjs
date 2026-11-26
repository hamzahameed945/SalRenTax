// @ts-check
import { defineConfig } from 'astro/config';

import preact from '@astrojs/preact';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { resolveSiteUrl } from './src/lib/seo/site.ts';

// https://astro.build/config
// Blog post lastmod dates (YYYY-MM-DD), keyed by absolute URL. Source: each
// post's own declared date in the repo — see the phase-1 fix plan for the
// per-post provenance table.
/** @type {Record<string, string>} */
const BLOG_LASTMOD = {
  'https://payrentax.me/de-de/blog/steuerklassen-ueberblick-2026/': '2026-11-02',
  'https://payrentax.me/en-us/blog/biweekly-vs-monthly-pay-2026/': '2026-11-03',
  'https://payrentax.me/en-us/blog/bonus-pay-explained-2026/': '2026-11-04',
  'https://payrentax.me/en-us/blog/hourly-to-salary-conversion-2026/': '2026-11-03',
  'https://payrentax.me/en-us/blog/how-much-house-can-you-afford-2026/': '2026-11-09',
  'https://payrentax.me/en-us/blog/how-much-rent-can-i-afford-2026/': '2026-11-02',
  'https://payrentax.me/en-us/blog/how-to-ask-for-a-raise-2026/': '2026-11-03',
  'https://payrentax.me/en-us/blog/how-to-calculate-a-salary-raise-2026/': '2026-11-08',
  'https://payrentax.me/en-us/blog/how-to-calculate-your-paycheck-2026/': '2026-11-07',
  'https://payrentax.me/en-us/blog/how-to-calculate-your-severance-pay-2026/': '2026-11-11',
  'https://payrentax.me/en-us/blog/how-to-estimate-your-tax-refund-2026/': '2026-11-10',
  'https://payrentax.me/en-us/blog/how-to-read-your-paystub-2026/': '2026-11-03',
  'https://payrentax.me/en-us/blog/is-overtime-taxed-higher-rate-2026/': '2026-11-15',
  'https://payrentax.me/en-us/blog/overtime-pay-explained-2026/': '2026-11-03',
  'https://payrentax.me/en-us/blog/salary-to-hourly-conversion-2026/': '2026-11-03',
  'https://payrentax.me/en-us/blog/salary-vs-hourly-pay-2026/': '2026-11-05',
  'https://payrentax.me/en-us/blog/take-home-pay-explained-2026/': '2026-11-03',
  'https://payrentax.me/en-us/blog/take-home-pay-on-100k-by-state-2026/': '2026-11-12',
  'https://payrentax.me/en-us/blog/weekly-vs-biweekly-pay-2026/': '2026-11-14',
  'https://payrentax.me/en-us/blog/what-is-an-annual-salary-2026/': '2026-11-06',
  'https://payrentax.me/en-us/blog/what-salary-do-you-need-to-afford-rent-2026/': '2026-11-13',
  'https://payrentax.me/es-mx/blog/como-calcular-tu-salario-neto-en-mexico-2026/': '2026-11-02',
  'https://payrentax.me/fr-fr/blog/comment-calculer-son-salaire-net-en-france-2026/': '2026-11-02',
  'https://payrentax.me/it-it/blog/come-calcolare-lo-stipendio-netto-in-italia-2026/': '2026-11-02',
  'https://payrentax.me/pt-br/blog/rescisao-direitos-trabalhistas-2026/': '2026-09-22',
  'https://payrentax.me/pt-br/blog/salario-liquido-2026/': '2026-09-25',
};

// A2 house-affordability amount variants are noindexed (phase-2 plan,
// Item 2): keep them out of the sitemap. The hub itself
// (/en-us/salary/house-affordability/) does not match this pattern —
// it has no -{amount} segment — and stays listed.
const HOUSE_AFFORDABILITY_VARIANT =
  /\/en-us\/salary\/house-affordability\/[a-z]+(?:-[a-z]+)*-\d+\/$/;

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
      filter: (page) =>
        !page.endsWith('/404') &&
        !page.endsWith('/404/') &&
        !HOUSE_AFFORDABILITY_VARIANT.test(page),
      // Honest lastmod: only blog posts get one, using each post's own
      // declared date (its BlogPosting schema dateModified, or the date in
      // its locale hub's blogPosts list — the two agree). Calculator pages
      // have no per-page date source, so they get NO lastmod rather than a
      // fabricated one. When a post is edited, update its entry here along
      // with the post's schema dateModified.
      serialize: (item) => {
        const lastmod = BLOG_LASTMOD[item.url];
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});

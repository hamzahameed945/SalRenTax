import type { APIRoute } from 'astro';
import { resolveSiteUrl } from '../lib/seo/site';

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const configured = import.meta.env.PUBLIC_SITE_URL as string | undefined;
  const siteUrl = configured
    ? resolveSiteUrl({ PUBLIC_SITE_URL: configured })
    : site?.origin ?? 'https://example.com';

  return new Response(
    `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap-index.xml\n`,
    { headers: { 'content-type': 'text/plain; charset=utf-8' } },
  );
};

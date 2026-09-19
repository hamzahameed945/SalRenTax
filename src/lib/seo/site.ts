/**
 * Single source of truth for the production site URL. Used by
 * astro.config.mjs (sitemap `site`) and by app code (canonical URLs,
 * JSON-LD, hreflang). Configure via the PUBLIC_SITE_URL environment
 * variable — see README.md for instructions. Falls back to a clearly
 * fake placeholder domain so a misconfigured build never claims a real
 * production domain that hasn't actually been supplied.
 */
export const DEFAULT_SITE_URL = 'https://example.com';

export function resolveSiteUrl(env: Record<string, string | undefined> = process.env): string {
  const configured = env.PUBLIC_SITE_URL;
  if (!configured) return DEFAULT_SITE_URL;
  // Strip a trailing slash so callers can safely do `${siteUrl}${pathname}`.
  return configured.replace(/\/+$/, '');
}

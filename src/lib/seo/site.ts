/**
 * Single source of truth for the production site URL. Used by
 * astro.config.mjs (sitemap `site`) and by app code (canonical URLs,
 * JSON-LD, hreflang). Configure via the PUBLIC_SITE_URL environment
 * variable — see README.md for instructions. If the variable is missing
 * (for example in a Cloudflare build without the setting), it falls back
 * to the production domain so canonical URLs, the sitemap and robots.txt
 * never point at a placeholder.
 */
export const DEFAULT_SITE_URL = 'https://payrentax.me';

export function resolveSiteUrl(env: Record<string, string | undefined> = process.env): string {
  const configured = env.PUBLIC_SITE_URL;
  if (!configured) return DEFAULT_SITE_URL;
  // Strip a trailing slash so callers can safely do `${siteUrl}${pathname}`.
  return configured.replace(/\/+$/, '');
}

/** Public contact address shown on the Contact page, legal pages and footer. */
export const CONTACT_EMAIL = 'contact@payrentax.me';

/**
 * Cloudflare Worker entry point.
 *
 * The site is a static Astro build served from ./dist via Workers Static
 * Assets. This tiny Worker sits in front of the assets and enforces one
 * rule: only the real domain is ever allowed to serve the site. Every other
 * hostname the Worker can be reached on — the production *.workers.dev URL,
 * the wildcard preview *.workers.dev URL, or any other host that ends up
 * pointed at this Worker — is permanently redirected to the canonical
 * domain, path and query string preserved.
 *
 * This makes the redirect independent of the "Enable workers.dev" toggle in
 * the Cloudflare dashboard (Workers & Pages → this worker → Settings →
 * Domains & Routes): even if that toggle is switched back on, this Worker
 * still refuses to render the site on that host and sends visitors/crawlers
 * to https://payrentax.me instead.
 *
 * `run_worker_first` must stay enabled in wrangler.jsonc for this file to
 * run on every request (see the "assets" block there) — without it, static
 * assets would be served directly and this check would be skipped.
 */

const CANONICAL_HOST = 'payrentax.me';

// Hosts that should bypass the redirect and be served directly. Only local
// dev/preview hosts belong here — never a public domain.
const BYPASS_HOSTS = new Set(['localhost', '127.0.0.1']);

interface Env {
  // Workers Static Assets binding, configured in wrangler.jsonc.
  ASSETS: { fetch(request: Request): Promise<Response> };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();

    if (host !== CANONICAL_HOST && !BYPASS_HOSTS.has(host)) {
      url.protocol = 'https:';
      url.hostname = CANONICAL_HOST;
      url.port = '';
      // 301: permanent redirect, so search engines consolidate on the
      // canonical domain instead of indexing the workers.dev URL.
      return Response.redirect(url.toString(), 301);
    }

    return env.ASSETS.fetch(request);
  },
};

import { resolveSiteUrl } from './site';

export interface PageMetadata {
  title: string;
  description: string;
  canonical: string;
}

function siteUrl(): string {
  // import.meta.env is populated by Vite at build time for both server and
  // client code; process.env is used as a fallback for non-Vite contexts (tests).
  const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : process.env;
  return resolveSiteUrl(env as Record<string, string | undefined>);
}

export function buildCanonical(pathname: string): string {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${siteUrl()}${normalized}`;
}

export function buildPageMetadata(
  title: string,
  description: string,
  pathname: string,
): PageMetadata {
  return {
    title,
    description,
    canonical: buildCanonical(pathname),
  };
}

import { describe, expect, it } from 'vitest';
import { DEFAULT_SITE_URL, resolveSiteUrl } from '../../src/lib/seo/site';

describe('resolveSiteUrl', () => {
  it('falls back to the placeholder domain when PUBLIC_SITE_URL is unset', () => {
    expect(resolveSiteUrl({})).toBe(DEFAULT_SITE_URL);
  });

  it('uses PUBLIC_SITE_URL when set', () => {
    expect(resolveSiteUrl({ PUBLIC_SITE_URL: 'https://PayRenTax.com' })).toBe(
      'https://PayRenTax.com',
    );
  });

  it('strips a trailing slash', () => {
    expect(resolveSiteUrl({ PUBLIC_SITE_URL: 'https://PayRenTax.com/' })).toBe(
      'https://PayRenTax.com',
    );
  });
});

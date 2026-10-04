import { describe, expect, it } from 'vitest';
import { getAffiliateOffers } from '../../src/lib/monetization/affiliates';

describe('getAffiliateOffers', () => {
  it('returns nothing for en-US when no affiliate URLs are configured', () => {
    expect(getAffiliateOffers('en-US', {})).toEqual([]);
  });

  it('returns only the offers that have a configured URL', () => {
    const offers = getAffiliateOffers('en-US', {
      PUBLIC_AFF_TURBOTAX_URL: 'https://example.com/turbotax?aff=1',
    });
    expect(offers.map((o) => o.id)).toEqual(['turbotax']);
    expect(offers[0].url).toBe('https://example.com/turbotax?aff=1');
  });

  it('ignores values that are not http(s) URLs', () => {
    expect(getAffiliateOffers('en-US', { PUBLIC_AFF_TURBOTAX_URL: 'not-a-url' })).toEqual([]);
    expect(getAffiliateOffers('en-US', { PUBLIC_AFF_TURBOTAX_URL: '  ' })).toEqual([]);
  });

  it('returns nothing for non-US locales even when URLs are configured', () => {
    const env = { PUBLIC_AFF_TURBOTAX_URL: 'https://example.com/turbotax?aff=1' };
    expect(getAffiliateOffers('pt-BR', env)).toEqual([]);
    expect(getAffiliateOffers('es-MX', env)).toEqual([]);
  });
});

/**
 * Central affiliate-link configuration for site monetization.
 *
 * Partner URLs are NEVER hard-coded: they come from PUBLIC_ environment
 * variables so tracking links can be rotated without touching page code.
 * When a URL is empty (or not a valid http(s) URL), that offer is dropped,
 * and the AffiliateCTA component renders nothing at all. This keeps the
 * live site clean until Shahwaiz signs up for the partner programs and
 * pastes his tracking links into the build environment.
 *
 * Programs (US tax season, Jan–Apr is peak):
 * - TurboTax  — CJ Affiliate, ~10–15% per sale, 15-day cookie, $50 threshold
 * - H&R Block — affiliate program via Impact (terms vary)
 * - FreeTaxUSA — pays per filed return, 90-day cookie
 */
export interface AffiliateOffer {
  id: string;
  name: string;
  url: string;
  tagline: string;
}

interface OfferDefinition extends Omit<AffiliateOffer, 'url'> {
  envKey: string;
}

const US_TAX_FILING_OFFERS: OfferDefinition[] = [
  {
    id: 'turbotax',
    name: 'TurboTax',
    envKey: 'PUBLIC_AFF_TURBOTAX_URL',
    tagline: 'The most popular DIY tax software in the US — free federal filing for simple returns.',
  },
  {
    id: 'hrblock',
    name: 'H&R Block',
    envKey: 'PUBLIC_AFF_HRBLOCK_URL',
    tagline: 'File online yourself or get help from a tax pro, in person or virtual.',
  },
  {
    id: 'freetaxusa',
    name: 'FreeTaxUSA',
    envKey: 'PUBLIC_AFF_FREETAXUSA_URL',
    tagline: 'Free federal filing and low-cost state returns from an IRS-authorized e-file provider.',
  },
];

function offerUrl(env: Record<string, string | undefined>, key: string): string {
  const raw = (env[key] ?? '').trim();
  return raw.startsWith('http://') || raw.startsWith('https://') ? raw : '';
}

/**
 * Returns the active affiliate offers for a locale. Empty array means the
 * CTA component renders nothing — no placeholder boxes, no dead links.
 */
export function getAffiliateOffers(
  locale: string,
  env: Record<string, string | undefined> = import.meta.env as unknown as Record<
    string,
    string | undefined
  >,
): AffiliateOffer[] {
  if (locale !== 'en-US') return [];
  return US_TAX_FILING_OFFERS.map(({ envKey, ...rest }) => ({
    ...rest,
    url: offerUrl(env, envKey),
  })).filter((offer) => offer.url.length > 0);
}

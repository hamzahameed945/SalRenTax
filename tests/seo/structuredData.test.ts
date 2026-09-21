import { describe, expect, it } from 'vitest';
import {
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildWebPageJsonLd,
  buildWebSiteJsonLd,
} from '../../src/lib/seo/structuredData';

describe('buildWebSiteJsonLd', () => {
  it('builds a valid WebSite entry', () => {
    const result = buildWebSiteJsonLd('PayRenTax', 'https://PayRenTax.com');
    expect(result['@type']).toBe('WebSite');
    expect(result.url).toBe('https://PayRenTax.com');
    expect(() => JSON.stringify(result)).not.toThrow();
  });
});

describe('buildWebPageJsonLd', () => {
  it('builds a valid WebPage entry with no undefined fields', () => {
    const result = buildWebPageJsonLd({
      name: 'Paycheck Calculator',
      description: 'Estimate your take-home pay.',
      url: 'https://PayRenTax.com/en-us/salary/paycheck-calculator/',
      inLanguage: 'en',
    });
    expect(result['@type']).toBe('WebPage');
    expect(JSON.parse(JSON.stringify(result))).not.toHaveProperty('undefined');
  });
});

describe('buildBreadcrumbJsonLd', () => {
  it('numbers positions starting at 1 in order', () => {
    const result = buildBreadcrumbJsonLd([
      { label: 'Home', url: 'https://PayRenTax.com/en-us/' },
      { label: 'Salary', url: 'https://PayRenTax.com/en-us/salary/' },
    ]);
    expect(result.itemListElement[0].position).toBe(1);
    expect(result.itemListElement[1].position).toBe(2);
    expect(result.itemListElement[1].name).toBe('Salary');
  });
});

describe('buildFaqJsonLd', () => {
  it('returns null for an empty FAQ list instead of fabricating one', () => {
    expect(buildFaqJsonLd([])).toBeNull();
  });

  it('maps question/answer pairs into schema.org Question/Answer nodes', () => {
    const result = buildFaqJsonLd([{ question: 'Q1?', answer: 'A1.' }]);
    expect(result?.mainEntity[0].name).toBe('Q1?');
    expect(result?.mainEntity[0].acceptedAnswer.text).toBe('A1.');
  });

  it('produces valid, parseable JSON with no undefined leaking in', () => {
    const result = buildFaqJsonLd([{ question: 'Q?', answer: 'A.' }]);
    const json = JSON.stringify(result);
    expect(json).not.toContain('undefined');
    expect(() => JSON.parse(json)).not.toThrow();
  });
});

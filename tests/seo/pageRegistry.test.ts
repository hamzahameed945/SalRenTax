import { describe, expect, it } from 'vitest';
import { findActivePage } from '../../src/seo/page-registry';
describe('page registry coverage',()=>{
  it('publishes the supplied easy salary gaps without duplicates',()=>{
    expect(findActivePage('en-US','states')).toBeDefined();
    const paths=[
      ['en-US','salary/annual-salary-calculator'],['en-US','states/illinois-paycheck-calculator'],
      ['de-DE','salary/stundenlohn-rechner'],['de-DE','salary/gehaltsrechner-teilzeit'],['de-DE','salary/minijob-rechner'],
      ['de-DE','salary/brutto-netto-rechner-bayern'],['de-DE','salary/brutto-netto-rechner-nrw'],
      ['es-ES','labor/calculadora-despido-improcedente'],['es-MX','labor/calculadora-liquidacion'],['es-MX','salary/sueldo-bruto-y-neto'],
      ['pt-BR','salary/calculadora-salario-liquido'],['pt-BR','labor/calcular-ferias'],['pt-BR','labor/calculadora-horas-extras'],
    ] as const;
    for(const [locale,slug] of paths) expect(findActivePage(locale,slug)).toBeDefined();
  });
  it('does not join Germany and Netherlands brutto/netto pages into one hreflang group',()=>{
    expect(findActivePage('de-DE','salary/brutto-netto-rechner')?.equivalentPageGroup).toBe('de-brutto-netto-rechner');
    expect(findActivePage('nl-NL','salary/bruto-netto-calculator')?.equivalentPageGroup).toBe('nl-bruto-netto-calculator');
  });
});

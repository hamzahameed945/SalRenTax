# Keyword Coverage Audit — Salary/Labor Scope

This file maps the supplied keyword research to the current implementation. Tax/rent-only clusters remain outside this salary-focused release.

## Implemented dedicated intent pages

### United States
- `annual salary calculator` → `/en-us/salary/annual-salary-calculator/`
- `paystub calculator` → `/en-us/salary/paystub-calculator/`
- `illinois paycheck calculator` → `/en-us/states/illinois-paycheck-calculator/`

### Germany
- `stundenlohn rechner` → `/de-de/salary/stundenlohn-rechner/`
- `gehaltsrechner teilzeit` → `/de-de/salary/gehaltsrechner-teilzeit/`
- `minijob rechner` → `/de-de/salary/minijob-rechner/`
- `brutto netto rechner bayern` → `/de-de/salary/brutto-netto-rechner-bayern/`
- `brutto netto rechner nrw` → `/de-de/salary/brutto-netto-rechner-nrw/`

### Spain
- `calculadora despido improcedente` → `/es-es/labor/calculadora-despido-improcedente/`

### Mexico
- `calculadora de liquidacion` → `/es-mx/labor/calculadora-liquidacion/`
- `sueldo bruto y neto` → `/es-mx/salary/sueldo-bruto-y-neto/`

### Brazil
- `calculadora de salário líquido` → `/pt-br/salary/calculadora-salario-liquido/`
- `simulador salário líquido 2026` → same Brazil net-salary page
- `calculadora de férias` / `como calcular ferias` / `cálculo de férias` → `/pt-br/labor/calcular-ferias/`
- `calculadora de horas extras` → `/pt-br/labor/calculadora-horas-extras/`

## Covered by broader existing tools

- US `hourly wage calculator` → existing hourly-to-salary / salary-to-hourly tools.
- US `paycheck tax calculator` and `income calculator` → paycheck category + paycheck calculator intent.
- US `salary estimator` → salary category + paycheck/salary conversion tools; a separate generic estimator is not necessary because it would largely duplicate those tools.
- UK `salary to hourly rate calculator uk`, `hourly rate calculator uk` → `/en-gb/salary/salary-to-hourly/`.
- UK `hourly wage calculator` → existing salary-to-hourly intent; no thin duplicate page is published.
- Germany `gehaltsrechner 2026`, `lohnrechner` → `/de-de/salary/brutto-netto-rechner/` and salary category.
- Spain `calcular finiquito`, `calculo indemnizacion despido`, `finiquito baja voluntaria`, `indemnizacion por despido` → `/es-es/labor/calcular-finiquito/` with the dedicated improcedente page for that specific intent.
- Mexico `calculadora de finiquito`, `calculadora isr` → existing `/es-mx/labor/calculadora-finiquito/` and `/es-mx/salary/calculadora-isr/`.
- Brazil `calcular rescisão`, `calculadora rescisão`, `calcular décimo terceiro` → existing rescisão and décimo-terceiro pages.

## Planned, not published

- Germany `gehaltsrechner tvöd` and `gehaltsrechner öffentlicher dienst`: the repository does not yet contain source-backed 2026 TVöD/public-service salary tables, so these remain planned instead of using a fabricated pay table.
- Germany `midijob rechner` and `werkstudent rechner`: the supplied research identified the opportunity, but this release does not invent their legal contribution rules.

## Deliberately outside this salary release

The supplied research also contains tax/rent clusters such as Germany Steuerklasse, Brazil INSS-only pages, UK rent calculators, US rent calculators and Ireland inheritance tax. Those remain outside this salary/labor implementation because they belong to the separate tax/rent workstream.

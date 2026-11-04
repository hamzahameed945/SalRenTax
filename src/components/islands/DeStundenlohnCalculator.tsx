import SalaryToHourlyCalculator from './SalaryToHourlyCalculator';
import { errors } from '../../i18n/de-DE/errors';

// Results here are already Calculate-gated: SalaryToHourlyCalculator
// only updates its results on its Calculate press and restores its
// defaults on its Reset press, so no second pair of buttons is added.
// No chart: the outputs are equivalent hourly/daily/weekly/monthly
// figures, not a total split into additive money parts.
export default function DeStundenlohnCalculator() {
  return (
    <SalaryToHourlyCalculator
      locale="de-DE"
      currency="EUR"
      t={{ errors }}
      labels={{
        annualSalary: 'Jahresgehalt (€)',
        hoursPerWeek: 'Stunden pro Woche',
        weeksPerYear: 'Arbeitswochen pro Jahr',
        resultsHeading: 'Stundenlohn und Äquivalente',
        hourlyWage: 'Stundenlohn',
        daily: 'Täglich',
        weekly: 'Wöchentlich',
        biweekly: 'Alle zwei Wochen',
        monthly: 'Monatlich',
        placeholder: 'Geben Sie Jahresgehalt und Arbeitszeit ein, um die Äquivalente zu sehen.',
      }}
    />
  );
}

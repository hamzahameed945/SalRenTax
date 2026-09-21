import SalaryToHourlyCalculator from './SalaryToHourlyCalculator';

export default function DeStundenlohnCalculator() {
  return (
    <SalaryToHourlyCalculator
      locale="de-DE"
      currency="EUR"
      labels={{
        annualSalary:   'Jahresgehalt (€)',
        hoursPerWeek:   'Stunden pro Woche',
        weeksPerYear:   'Arbeitswochen pro Jahr',
        resultsHeading: 'Stundenlohn und Äquivalente',
        hourlyWage:     'Stundenlohn',
        daily:          'Täglich',
        weekly:         'Wöchentlich',
        biweekly:       'Alle zwei Wochen',
        monthly:        'Monatlich',
        placeholder:    'Geben Sie Jahresgehalt und Arbeitszeit ein, um die Äquivalente zu sehen.',
      }}
    />
  );
}

import { enUS } from '../../i18n/en-US';
import SalaryToHourlyCalculator from './SalaryToHourlyCalculator';

export default function DeStundenlohnCalculator() {
  return <SalaryToHourlyCalculator t={enUS} locale="de-DE" currency="EUR" />;
}

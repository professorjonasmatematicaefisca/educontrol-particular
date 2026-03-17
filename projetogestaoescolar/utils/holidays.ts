import { format } from 'date-fns';

export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
}

export const NATIONAL_HOLIDAYS_2026: Holiday[] = [
  { date: '2026-01-01', name: 'Confraternização Universal' },
  { date: '2026-02-17', name: 'Carnaval' },
  { date: '2026-04-03', name: 'Sexta-feira Santa' },
  { date: '2026-04-05', name: 'Páscoa' },
  { date: '2026-04-21', name: 'Tiradentes' },
  { date: '2026-05-01', name: 'Dia do Trabalho' },
  { date: '2026-06-04', name: 'Corpus Christi' },
  { date: '2026-09-07', name: 'Independência do Brasil' },
  { date: '2026-10-12', name: 'Nossa Senhora Aparecida' },
  { date: '2026-11-02', name: 'Finados' },
  { date: '2026-11-15', name: 'Proclamação da República' },
  { date: '2026-11-20', name: 'Dia da Consciência Negra' },
  { date: '2026-12-25', name: 'Natal' },
];

export const getHoliday = (date: Date): string | null => {
  const dateStr = format(date, 'yyyy-MM-dd');
  const holiday = NATIONAL_HOLIDAYS_2026.find(h => h.date === dateStr);
  return holiday ? holiday.name : null;
};

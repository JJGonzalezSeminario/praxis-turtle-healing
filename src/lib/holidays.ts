export function getBerlinHolidays(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  const easterSunday = new Date(year, month - 1, day);

  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const format = (date: Date) => {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split('T')[0];
  };

  return [
    { date: `${year}-01-01`, name: 'Neujahr' },
    { date: `${year}-03-08`, name: 'Frauentag' },
    { date: format(addDays(easterSunday, -2)), name: 'Karfreitag' },
    { date: format(addDays(easterSunday, 1)), name: 'Ostermontag' },
    { date: `${year}-05-01`, name: 'Tag der Arbeit' },
    { date: format(addDays(easterSunday, 39)), name: 'Christi Himmelfahrt' },
    { date: format(addDays(easterSunday, 50)), name: 'Pfingstmontag' },
    { date: `${year}-10-03`, name: 'Tag der Dt. Einheit' },
    { date: `${year}-12-25`, name: '1. Weihnachtstag' },
    { date: `${year}-12-26`, name: '2. Weihnachtstag' },
  ];
}
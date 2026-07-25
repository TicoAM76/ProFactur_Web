const MADRID_TIME_ZONE = 'Europe/Madrid';

interface MadridDateParts {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
}

function assertValidDate(date: Date): void {
  if (Number.isNaN(date.getTime())) {
    throw new Error('La fecha fiscal no es válida.');
  }
}

function getMadridDateParts(date: Date): MadridDateParts {
  assertValidDate(date);

  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: MADRID_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  const values = new Map(
    formatter.formatToParts(date).map((part) => [part.type, part.value]),
  );

  const year = values.get('year');
  const month = values.get('month');
  const day = values.get('day');
  const hour = values.get('hour');
  const minute = values.get('minute');
  const second = values.get('second');

  if (!year || !month || !day || !hour || !minute || !second) {
    throw new Error('No fue posible obtener la fecha fiscal de Madrid.');
  }

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
  };
}

function getMadridOffset(date: Date, parts: MadridDateParts): string {
  const localTimeAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );

  const instantWithoutMilliseconds = Math.trunc(date.getTime() / 1000) * 1000;

  const offsetMinutes = Math.round(
    (localTimeAsUtc - instantWithoutMilliseconds) / 60_000,
  );

  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absoluteMinutes = Math.abs(offsetMinutes);

  const hours = String(Math.floor(absoluteMinutes / 60)).padStart(2, '0');

  const minutes = String(absoluteMinutes % 60).padStart(2, '0');

  return `${sign}${hours}:${minutes}`;
}

export function formatMadridInvoiceDate(date: Date): string {
  const parts = getMadridDateParts(date);

  return `${parts.day}-${parts.month}-${parts.year}`;
}

export function formatMadridFiscalDateTime(date: Date): string {
  const parts = getMadridDateParts(date);
  const offset = getMadridOffset(date, parts);

  return [
    `${parts.year}-${parts.month}-${parts.day}`,
    `T${parts.hour}:${parts.minute}:${parts.second}`,
    offset,
  ].join('');
}

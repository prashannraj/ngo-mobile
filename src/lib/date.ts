const DEFAULT_TZ = 'Asia/Kathmandu';

export function formatDateTimeYmdHms(input: string | Date | null | undefined, timeZone: string = DEFAULT_TZ): string {
  if (!input) return '-';

  if (typeof input === 'string') {
    const s = input.trim();
    // Already in desired format
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) return s;
    // Date-only
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s} 00:00:00`;
  }

  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d.getTime())) return String(input);

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(d);

  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '';
  const y = get('year');
  const m = get('month');
  const day = get('day');
  const hh = get('hour');
  const mm = get('minute');
  const ss = get('second');

  if (!y || !m || !day) return String(input);
  return `${y}-${m}-${day} ${hh || '00'}:${mm || '00'}:${ss || '00'}`;
}

